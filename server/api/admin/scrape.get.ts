/**
 * GET /api/admin/scrape?url=https://hobbygames.ru/catan
 * Парсит страницу товара на hobbygames.ru и возвращает фото + описание
 */

import { JSDOM } from 'jsdom'

const HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = query.url as string

  if (!url || !url.includes('hobbygames.ru')) {
    throw createError({ statusCode: 400, message: 'Укажите корректный URL с hobbygames.ru' })
  }

  try {
    const resp = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(15000),
    })

    if (!resp.ok) {
      throw createError({ statusCode: 404, message: 'Страница не найдена' })
    }

    const html = await resp.text()
    const dom = new JSDOM(html)
    const doc = dom.window.document

    // Извлекаем картинки
    const images: string[] = []

    // Ищем в lightGallery
    const galleryLinks = doc.querySelectorAll('a.lightGallery, a[data-gallery-index]')
    for (const el of galleryLinks) {
      const href = el.getAttribute('href') || ''
      if (isGoodImage(href) && !images.includes(href)) {
        images.push(href)
      }
    }

    // data-thumb
    if (images.length === 0) {
      const items = doc.querySelectorAll('[data-thumb]')
      for (const el of items) {
        const a = el.querySelector('a[href]')
        const href = a?.getAttribute('href') || ''
        if (isGoodImage(href) && !images.includes(href)) {
          images.push(href)
        }
      }
    }

    // img теги
    if (images.length === 0) {
      const imgs = doc.querySelectorAll('img[src*="hobbygames.ru/image/cache"]')
      for (const img of imgs) {
        const src = img.getAttribute('src') || ''
        if (isGoodImage(src) && !images.includes(src)) {
          images.push(src)
        }
      }
    }

    // Извлекаем описание
    let description = ''
    const descEl = doc.querySelector('#desc, .desc-text')
    if (descEl) {
      let descHtml = descEl.innerHTML || ''
      // Нормализуем URL картинок
      descHtml = descHtml.replace(/src="\/image\//g, 'src="https://hobbygames.ru/image/')
      descHtml = descHtml.replace(/srcset="[^"]*"/g, '')
      descHtml = descHtml.replace(/<source[^>]*>/g, '')
      descHtml = descHtml.replace(/<\/?picture>/g, '')
      description = descHtml.trim()
    }

    return {
      success: true,
      images: images.slice(0, 20),
      description,
      title: doc.querySelector('h1')?.textContent?.trim() || '',
    }
  } catch (error: any) {
    throw createError({ statusCode: 500, message: `Ошибка парсинга: ${error.message}` })
  }
})

function isGoodImage(url: string): boolean {
  if (!url) return false
  if (!url.includes('hobbygames.ru/image')) return false
  if (url.includes('100x100')) return false
  if (url.includes('logo')) return false
  if (url.includes('banner')) return false
  if (url.includes('teg')) return false
  if (url.includes('avatar')) return false
  return true
}
