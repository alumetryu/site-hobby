/**
 * GET /api/admin/categories — список категорий
 * POST /api/admin/categories — сохранить категорию
 * DELETE /api/admin/categories?id=xxx — удалить категорию
 */

import { getAllCategories, saveCategory, deleteCategory } from '../../utils/db'

export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    return { success: true, categories: await getAllCategories() }
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    await saveCategory(body)
    return { success: true, categories: await getAllCategories() }
  }

  if (event.method === 'DELETE') {
    const query = getQuery(event)
    const id = parseInt(query.id as string)
    if (!id) throw createError({ statusCode: 400, message: 'Не указан ID' })
    await deleteCategory(id)
    return { success: true }
  }
})
