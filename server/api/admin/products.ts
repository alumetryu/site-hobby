/**
 * GET /api/admin/products — список товаров из базы
 * POST /api/admin/products — сохранить товар
 * DELETE /api/admin/products?id=xxx — удалить товар
 */

import { getAllProducts, saveProduct, deleteProduct } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    if (event.method === 'GET') {
      const query = getQuery(event)
      const search = (query.search as string) || ''
      const category = (query.category as string) || ''
      const products = await getAllProducts(search, category)
      return { success: true, products }
    }

    if (event.method === 'POST') {
      const body = await readBody(event)
      
      if (!body.id) {
        throw createError({ statusCode: 400, message: 'Не указан ID товара' })
      }

      const product = await saveProduct(body)
      return { success: true, product }
    }

    if (event.method === 'DELETE') {
      const query = getQuery(event)
      const id = query.id as string
      if (!id) throw createError({ statusCode: 400, message: 'Не указан ID' })
      await deleteProduct(id)
      return { success: true }
    }
  } catch (error: any) {
    console.error('[Admin Products API Error]', error)
    throw createError({ 
      statusCode: error.statusCode || 500, 
      message: error.message || 'Внутренняя ошибка сервера' 
    })
  }
})
