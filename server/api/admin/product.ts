/**
 * GET /api/admin/product?id=xxx — получить товар из базы
 * DELETE /api/admin/product?id=xxx — удалить товар из базы
 */

import { getProduct, deleteProduct } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = query.id as string

  if (!id) {
    throw createError({ statusCode: 400, message: 'Не указан ID' })
  }

  if (event.method === 'GET') {
    const product = await getProduct(id)
    return { success: true, product }
  }

  if (event.method === 'DELETE') {
    await deleteProduct(id)
    return { success: true, message: 'Удалено' }
  }
})
