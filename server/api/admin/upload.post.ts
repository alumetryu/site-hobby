/**
 * POST /api/admin/upload — загрузка изображений
 */

import { writeFile, mkdir } from 'fs/promises'
import { resolve } from 'path'
import { existsSync } from 'fs'

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'Нет файла' })
  }

  const file = formData[0]
  if (!file.filename || !file.data) {
    throw createError({ statusCode: 400, message: 'Неверный файл' })
  }

  // Создаём папку uploads если нет
  const uploadsDir = resolve(process.cwd(), 'public', 'uploads')
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true })
  }

  // Генерируем уникальное имя
  const ext = file.filename.split('.').pop() || 'jpg'
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filePath = resolve(uploadsDir, name)

  await writeFile(filePath, file.data)

  return {
    success: true,
    url: `/uploads/${name}`,
    filename: name,
  }
})
