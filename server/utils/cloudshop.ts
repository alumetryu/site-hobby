/**
 * CloudShop API клиент для Nuxt сервера
 * На основе bot_v2/hobby_games_bot/services/cloudshop_api.py
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

const COMPANY_ID = process.env.CS_COMPANY_ID || ''
const STORE_ID = process.env.CS_STORE_ID || ''

function getConfig() {
  try {
    const envPath = resolve(process.cwd(), '.env')
    const content = readFileSync(envPath, 'utf-8')
    const env: Record<string, string> = {}
    for (const line of content.split('\n')) {
      const [key, ...value] = line.split('=')
      if (key && value.length) {
        env[key.trim()] = value.join('=').trim()
      }
    }
    return {
      email: env.CS_EMAIL || '',
      password: env.CS_PASSWORD || '',
      url: env.CS_URL || '',
    }
  } catch {
    return { email: '', password: '', url: '' }
  }
}

const config = getConfig()
let API_BASE = config.url
if (API_BASE.includes('/pos')) {
  API_BASE = API_BASE.split('/pos')[0]
}
API_BASE = API_BASE.replace(/\/+$/, '')

const HEADERS: Record<string, string> = {
  'accept': 'application/json, text/plain, */*',
  'content-type': 'application/json',
  'api': 'v3',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'origin': API_BASE,
  'referer': `${API_BASE}/pos/home`,
}

// Сессия — глобальная
let sessionCookies = ''
let sessionExpiry = 0
let loginInProgress = false
let loginWaiters: Array<() => void> = []

interface CloudShopProduct {
  _id: string
  name: string
  price: number
  stock: Record<string, number>
  total_stock: number
  code?: string
  type?: string
  group?: any
  description?: string
  barcode?: string
  images?: string[]
  [key: string]: any // разрешаем дополнительные поля
}

interface CloudShopClient {
  _id: string
  name: string
  phones: string[]
  emails: string[]
  discount: number
  discount_card: string
  bday: string | null
  sex?: string
  enable_savings?: boolean
  loyalty_type?: string
  debt?: number
}

// Кэш каталога
let catalogCache: CloudShopProduct[] | null = null
let catalogCacheTime = 0
const CATALOG_CACHE_TTL = 5 * 60 * 1000
let catalogLoading = false

// Кэш клиентов
let clientsCache: CloudShopClient[] | null = null
let clientsCacheTime = 0
const CLIENTS_CACHE_TTL = 10 * 60 * 1000

async function login(): Promise<void> {
  if (loginInProgress) {
    return new Promise<void>((resolve) => {
      loginWaiters.push(resolve)
    })
  }

  loginInProgress = true
  loginWaiters = []

  try {
    console.log('[CloudShop] Авторизация...')
    const resp = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: { ...HEADERS, referer: `${API_BASE}/pos/login` },
      body: JSON.stringify({ login: config.email, password: config.password }),
    })

    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`CloudShop auth failed: HTTP ${resp.status}, body=${text.slice(0, 200)}`)
    }

    // Сохраняем cookies из ответа
    const setCookies = resp.headers.getSetCookie()
    if (setCookies && setCookies.length > 0) {
      sessionCookies = setCookies.map(c => c.split(';')[0]).join('; ')
    } else {
      // Fallback: пробуем получить cookie напрямую
      const cookieHeader = resp.headers.get('set-cookie')
      if (cookieHeader) {
        sessionCookies = cookieHeader.split(';')[0]
      }
    }

    sessionExpiry = Date.now() + 25 * 60 * 1000
    console.log('[CloudShop] Авторизация выполнена')
  } finally {
    loginInProgress = false
    for (const waiter of loginWaiters) {
      waiter()
    }
    loginWaiters = []
  }
}

async function ensureSession(): Promise<void> {
  if (!sessionCookies || Date.now() > sessionExpiry) {
    await login()
  }
}

async function apiGet(path: string): Promise<any> {
  await ensureSession()

  const encodedPath = encodeURIComponent(path)
  const url = `${API_BASE}/proxy?path=${encodedPath}&timezone=18000`

  const resp = await fetch(url, {
    headers: {
      ...HEADERS,
      cookie: sessionCookies,
    },
  })

  if (resp.status === 401) {
    console.log('[CloudShop] Сессия истекла, перелогиниваюсь...')
    sessionCookies = ''
    await login()

    const resp2 = await fetch(url, {
      headers: {
        ...HEADERS,
        cookie: sessionCookies,
      },
    })
    if (!resp2.ok) throw new Error(`CloudShop API error: ${resp2.status}`)
    return resp2.json()
  }

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`CloudShop API error: HTTP ${resp.status} для ${path}, body=${text.slice(0, 200)}`)
  }
  return resp.json()
}

export async function fetchCatalog(): Promise<CloudShopProduct[]> {
  if (catalogCache && Date.now() - catalogCacheTime < CATALOG_CACHE_TTL) {
    return catalogCache
  }

  if (catalogLoading) {
    for (let i = 0; i < 1200; i++) {
      await new Promise(r => setTimeout(r, 100))
      if (catalogCache && Date.now() - catalogCacheTime < CATALOG_CACHE_TTL) {
        return catalogCache
      }
      if (!catalogLoading) break
    }
    if (catalogCache) return catalogCache
  }

  catalogLoading = true

  try {
    console.log('[CloudShop] Загрузка каталога...')
    const allItems: CloudShopProduct[] = []
    const limit = 1000
    let offset = 0

    while (true) {
      const data = await apiGet(`/data/${COMPANY_ID}/catalog?offset=${offset}&limit=${limit}`)
      const items = data.data || []
      allItems.push(...items)
      if (allItems.length >= data.total || !items.length) break
      offset += limit
    }

    catalogCache = allItems
    catalogCacheTime = Date.now()
    console.log(`[CloudShop] Каталог загружен: ${allItems.length} товаров`)
    // Логируем структуру первого товара для отладки
    if (allItems.length > 0) {
      const sample = allItems[0]
      console.log('[CloudShop] Пример товара:', JSON.stringify(Object.keys(sample)))
      console.log('[CloudShop] Поле images:', JSON.stringify(sample.images))
      console.log('[CloudShop] Поле description:', sample.description ? 'есть' : 'нет')
      console.log('[CloudShop] Поле group:', JSON.stringify(sample.group))
    }
    return allItems
  } finally {
    catalogLoading = false
  }
}

export async function fetchClients(): Promise<CloudShopClient[]> {
  if (clientsCache && Date.now() - clientsCacheTime < CLIENTS_CACHE_TTL) {
    return clientsCache
  }

  console.log('[CloudShop] Загрузка клиентов...')
  const allItems: CloudShopClient[] = []
  const limit = 1000
  let offset = 0

  while (true) {
    const data = await apiGet(`/data/${COMPANY_ID}/clients?offset=${offset}&limit=${limit}`)
    const items = data.data || []
    allItems.push(...items)
    if (allItems.length >= data.total || !items.length) break
    offset += limit
  }

  clientsCache = allItems
  clientsCacheTime = Date.now()
  console.log(`[CloudShop] Клиенты загружены: ${allItems.length}`)
  return allItems
}

export async function findClient(cardNumber: string): Promise<CloudShopClient | null> {
  const clients = await fetchClients()
  const cleanCard = cardNumber.replace(/\D/g, '')

  for (const client of clients) {
    const clientCard = (client.discount_card || '').replace(/\D/g, '')
    const clientPhones = (client.phones || []).map(p => p.replace(/\D/g, ''))

    if (clientCard === cleanCard || clientPhones.includes(cleanCard)) {
      return client
    }
  }

  return null
}

export async function searchProducts(query: string): Promise<CloudShopProduct[]> {
  const catalog = await fetchCatalog()
  const q = query.toLowerCase().trim()
  return catalog.filter(item => item.name.toLowerCase().includes(q))
}

export async function getProductsInStock(): Promise<CloudShopProduct[]> {
  const catalog = await fetchCatalog()
  return catalog.filter(item => (item.stock?.[STORE_ID] || 0) > 0)
}

export { STORE_ID, COMPANY_ID }
export type { CloudShopProduct, CloudShopClient }
