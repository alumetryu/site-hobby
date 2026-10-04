/**
 * GET /api/product-info?id=xxx — получить информацию о товаре
 */

import { fetchCatalog, STORE_ID } from '../utils/cloudshop'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = query.id as string

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Не указан ID товара'
    })
  }

  try {
    const catalog = await fetchCatalog()
    const product = catalog.find(item => item._id === id)

    if (!product) {
      throw createError({
        statusCode: 404,
        message: 'Товар не найден'
      })
    }

    return {
      success: true,
      product: {
        id: product._id,
        name: product.name,
        price: product.price,
        stock: product.stock?.[STORE_ID] || 0,
        code: product.code,
        type: product.type,
        group: product.group,
        description: product.description,
        barcode: product.barcode,
        images: product.images || [],
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: `Ошибка: ${error.message}`
    })
  }
})
