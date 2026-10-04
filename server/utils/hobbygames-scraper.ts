/**
 * Мост к hobbygames.ru — извлекает фото и описание товаров
 * Работает через прямой поиск на сайте
 */

import { JSDOM } from 'jsdom'

interface ProductData {
  images: string[]
  description: string
  url: string
}

const cache = new Map<string, ProductData | null>()
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000
const cacheTimestamps = new Map<string, number>()

const HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'ru-RU,ru;q=0.9',
}

export async function getProductData(name: string, code?: string): Promise<ProductData> {
  const cacheKey = `${name}|${code || ''}`

  if (cache.has(cacheKey)) {
    const ts = cacheTimestamps.get(cacheKey) || 0
    if (Date.now() - ts < CACHE_TTL) {
      return cache.get(cacheKey) || emptyResult()
    }
  }

  try {
    // Очищаем название для поиска
    const query = cleanName(name)

    // Ищем на hobbygames.ru
    const result = await searchAndExtract(query)

    if (result) {
      cache.set(cacheKey, result)
      cacheTimestamps.set(cacheKey, Date.now())
      return result
    }

    // Пробуем по артикулу
    const artMatch = name.match(/арт\.?\s*(\d{5,})/i)
    if (artMatch) {
      const artResult = await searchAndExtract(artMatch[1])
      if (artResult) {
        cache.set(cacheKey, artResult)
        cacheTimestamps.set(cacheKey, Date.now())
        return artResult
      }
    }

    cache.set(cacheKey, null)
    cacheTimestamps.set(cacheKey, Date.now())
    return emptyResult()
  } catch {
    return emptyResult()
  }
}

function emptyResult(): ProductData {
  return { images: [], description: '', url: '' }
}

function cleanName(name: string): string {
  return name
    .replace(/^Настольная\s+игра\s*[\s:"]*\s*/i, '')
    .replace(/^АКСЕССУАРЫ\s*[\s:]*\s*/i, '')
    .replace(/^Игра\s*[\s"]*\s*/i, '')
    .replace(/,\s*арт\.?\s*\S+$/i, '')
    .replace(/\s+арт\.?\s*\S+$/i, '')
    .replace(/\s*\(.*?\)\s*$/, '')
    .replace(/['"]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function searchAndExtract(query: string): Promise<ProductData | null> {
  try {
    // Пробуем прямой URL (транслитерация названия)
    const slug = transliterate(query)
    const directResult = await tryFetchProduct(`/${slug}`)
    if (directResult && directResult.images.length > 0) {
      return directResult
    }

    // Пробуем варианты URL
    const words = query.split(/\s+/).filter(w => w.length > 2)
    for (const word of words) {
      const wordSlug = transliterate(word)
      const result = await tryFetchProduct(`/${wordSlug}`)
      if (result && result.images.length > 0) {
        return result
      }
    }

    return null
  } catch {
    return null
  }
}

function extractProductUrls(html: string): string[] {
  const urls: string[] = []
  const regex = /href="(\/[a-z0-9-]+)"/g
  let match

  // Исключаем страницы категорий и служебные
  const excludes = [
    'catalog', 'account', 'contacts', 'news', 'games-lib', 'zvezda',
    'zakaz', 'special', 'discounts', 'coming-soon', 'download',
    'manufacturer', 'promokarti', 'podborki', 'login', 'register',
    'bonus', 'nastolnie', 'vargejmi', 'kompjuternie', 'rolevie',
    'detskie', 'aksessuari', 'sbornie', 'kollekcionnie', 'figurki',
    'knigi', 'pazli', 'top-', 'series', 'igri-dlja', 'semejnie',
    'strategicheskie', 'igrovie', '25-let', 'dr-hw', 'landing',
  ]

  while ((match = regex.exec(html)) !== null) {
    const url = match[1]
    if (url.length < 4 || url.length > 60) continue

    let excluded = false
    for (const exc of excludes) {
      if (url.includes(exc)) {
        excluded = true
        break
      }
    }

    if (!excluded && !urls.includes(url)) {
      urls.push(url)
    }
  }

  return urls.slice(0, 30)
}

async function tryFetchProduct(url: string): Promise<ProductData | null> {
  const fullUrl = `https://hobbygames.ru${url}`

  try {
    const resp = await fetch(fullUrl, {
      headers: HEADERS,
      signal: AbortSignal.timeout(10000),
    })

    if (!resp.ok) return null

    const html = await resp.text()
    const dom = new JSDOM(html)
    const doc = dom.window.document

    // Проверяем что это страница товара (не лендинг)
    const h1 = doc.querySelector('h1')
    const priceEl = doc.querySelector('.product-card-price__current, .product-price-card__price')
    const cartBtn = doc.querySelector('.to-cart, .product-card-btn')
    if (!h1 || !priceEl || !cartBtn) return null

    // Проверяем URL — не лендинг
    const urlLower = url.toLowerCase()
    if (urlLower.includes('25-let') || urlLower.includes('dr-hw') || urlLower.includes('landing') || urlLower.includes('sale') || urlLower.includes('skidki')) return null

    // Извлекаем картинки
    const images: string[] = []

    // Ищем в lightGallery
    const galleryLinks = doc.querySelectorAll('a.lightGallery, a[data-gallery-index]')
    for (const el of galleryLinks) {
      const href = el.getAttribute('href') || ''
      if (isGoodImage(href)) {
        if (!images.includes(href)) images.push(href)
      }
    }

    // Если нет, ищем data-thumb
    if (images.length === 0) {
      const items = doc.querySelectorAll('[data-thumb]')
      for (const el of items) {
        const a = el.querySelector('a[href]')
        const href = a?.getAttribute('href') || ''
        if (isGoodImage(href)) {
          if (!images.includes(href)) images.push(href)
        }
      }
    }

    // Если нет, ищем img
    if (images.length === 0) {
      const imgs = doc.querySelectorAll('img[src*="hobbygames.ru/image/cache"]')
      for (const img of imgs) {
        const src = img.getAttribute('src') || ''
        if (isGoodImage(src)) {
          if (!images.includes(src)) images.push(src)
        }
      }
    }

    // Извлекаем описание
    let description = ''
    const descEl = doc.querySelector('#desc, .desc-text, .product-description')
    if (descEl) {
      let descHtml = descEl.innerHTML || ''
      descHtml = descHtml.replace(/src="\/image\//g, 'src="https://hobbygames.ru/image/')
      descHtml = descHtml.replace(/srcset="[^"]*"/g, '')
      descHtml = descHtml.replace(/<source[^>]*>/g, '')
      descHtml = descHtml.replace(/<\/?picture>/g, '')
      description = descHtml.trim()
    }

    return { images: images.slice(0, 15), description, url: fullUrl }
  } catch {
    return null
  }
}

function isGoodImage(url: string): boolean {
  if (!url) return false
  if (!url.includes('hobbygames.ru/image')) return false
  if (url.includes('100x100')) return false
  if (url.includes('logo')) return false
  if (url.includes('banner')) return false
  if (url.includes('teg')) return false
  if (url.includes('manufacturer')) return false
  if (url.includes('avatar')) return false
  return true
}

function transliterate(text: string): string {
  const map: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    ' ': '-', ':': '', ',': '', '.': '', '!': '', '?': '', '"': '', "'": '',
  }

  return text
    .toLowerCase()
    .split('')
    .map(c => map[c] || c)
    .join('')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
