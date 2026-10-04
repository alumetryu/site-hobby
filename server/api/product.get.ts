/**
 * GET /api/product?id=xxx — товар с фото и описанием
 * Сначала проверяет базу данных, потом hobbygames.ru
 */

import { fetchCatalog, STORE_ID } from '../utils/cloudshop'
import { getProductData } from '../utils/hobbygames-scraper'
import { getProduct } from '../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = query.id as string

  if (!id) {
    throw createError({ statusCode: 400, message: 'Не указан ID товара' })
  }

  try {
    const catalog = await fetchCatalog()
    const item = catalog.find(p => p._id === id)

    if (!item) {
      throw createError({ statusCode: 404, message: 'Товар не найден' })
    }

    // Сначала проверяем базу данных
    const dbProduct = await getProduct(id)

    let images: string[] = []
    let description = ''
    let hobbygamesUrl = ''
    let imageSize = 450

    if (dbProduct && (dbProduct.images.length > 0 || dbProduct.description)) {
      // Используем данные из базы
      images = dbProduct.images
      description = dbProduct.description
      imageSize = dbProduct.image_size || 450
    } else {
      // Ищем на hobbygames.ru
      const hg = await getProductData(item.name, item.code)
      images = hg.images
      description = hg.description
      hobbygamesUrl = hg.url
    }

    return {
      success: true,
      product: {
        id: item._id,
        name: dbProduct?.name || item.name,
        price: item.price,
        stock: item.stock?.[STORE_ID] || 0,
        code: item.code,
        type: item.type,
        barcode: item.barcode,
        images,
        description,
        hobbygamesUrl,
        category: dbProduct?.category || '',
        image_size: imageSize,
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: `Ошибка: ${error.message}` })
  }
})
