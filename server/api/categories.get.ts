/**
 * GET /api/categories — получить все категории
 */

import { getAllCategories } from '../utils/db'

export default defineEventHandler(async () => {
  return { success: true, categories: await getAllCategories() }
})
