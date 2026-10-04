/**
 * SQLite база данных для админ-панели
 * Хранит пользовательские описания, фото, категории товаров
 */

import initSqlJs, { Database } from 'sql.js'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'

const DB_PATH = resolve(process.cwd(), 'data', 'products.db')

// Создаём папку data если нет
const dataDir = dirname(DB_PATH)
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

let db: Database | null = null

export async function getDb(): Promise<Database> {
  if (db) return db

  const SQL = await initSqlJs()

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  // Создаём таблицы если нет
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      images TEXT DEFAULT '[]',
      category TEXT DEFAULT '',
      featured INTEGER DEFAULT 0,
      is_new INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      published INTEGER DEFAULT 1,
      image_size INTEGER DEFAULT 450,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // Миграции — добавляем новые колонки если нет
  const migrations = [
    { column: 'image_size', type: 'INTEGER DEFAULT 450' },
    { column: 'is_new', type: 'INTEGER DEFAULT 0' },
  ]

  for (const m of migrations) {
    try {
      db.run(`SELECT ${m.column} FROM products LIMIT 1`)
    } catch {
      db.run(`ALTER TABLE products ADD COLUMN ${m.column} ${m.type}`)
    }
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // Добавляем категории по умолчанию
  const defaultCategories = [
    { name: 'Настольные игры', slug: 'nastolnye' },
    { name: 'Варгеймы', slug: 'vargejmy' },
    { name: 'ККИ', slug: 'kki' },
    { name: 'НРИ', slug: 'nri' },
    { name: 'Аксессуары', slug: 'aksessuary' },
    { name: 'Сборные модели', slug: 'models' },
  ]

  for (const cat of defaultCategories) {
    db.run(
      `INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)`,
      [cat.name, cat.slug]
    )
  }

  saveDb()
  return db
}

export function saveDb() {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  writeFileSync(DB_PATH, buffer)
}

// === ТОВАРЫ ===

export async function getProduct(id: string) {
  const database = await getDb()
  const result = database.exec('SELECT * FROM products WHERE id = ?', [id])
  if (result.length === 0 || result[0].values.length === 0) return null
  return formatProduct(result[0].values[0])
}

export async function saveProduct(data: {
  id: string
  name: string
  description?: string
  images?: string[]
  category?: string
  featured?: number
  is_new?: number
  sort_order?: number
  published?: number
  image_size?: number
}) {
  const database = await getDb()
  const existing = await getProduct(data.id)

  if (existing) {
    database.run(
      `UPDATE products SET 
        name = ?, description = ?, images = ?, category = ?, 
        featured = ?, is_new = ?, sort_order = ?, published = ?, image_size = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [
        data.name || existing.name,
        data.description ?? existing.description,
        JSON.stringify(data.images ?? existing.images),
        data.category ?? existing.category,
        data.featured ?? existing.featured,
        data.is_new ?? existing.is_new,
        data.sort_order ?? existing.sort_order,
        data.published ?? existing.published,
        data.image_size ?? existing.image_size ?? 450,
        data.id,
      ]
    )
  } else {
    database.run(
      `INSERT INTO products (id, name, description, images, category, featured, is_new, sort_order, published, image_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.name,
        data.description || '',
        JSON.stringify(data.images || []),
        data.category || '',
        data.featured ?? 0,
        data.is_new ?? 0,
        data.sort_order ?? 0,
        data.published ?? 1,
        data.image_size ?? 450,
      ]
    )
  }

  saveDb()
  return getProduct(data.id)
}

export async function deleteProduct(id: string) {
  const database = await getDb()
  database.run('DELETE FROM products WHERE id = ?', [id])
  saveDb()
}

export async function getAllProducts(search?: string, category?: string) {
  const database = await getDb()

  let query = 'SELECT * FROM products WHERE 1=1'
  const params: any[] = []

  if (search) {
    query += ' AND (name LIKE ? OR id LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }

  if (category) {
    query += ' AND category = ?'
    params.push(category)
  }

  query += ' ORDER BY featured DESC, sort_order ASC, updated_at DESC'

  const result = database.exec(query, params)
  if (result.length === 0) return []
  return result[0].values.map(row => formatProduct(row))
}

export async function getFeaturedProducts() {
  const database = await getDb()
  const result = database.exec('SELECT * FROM products WHERE featured = 1 AND published = 1 ORDER BY sort_order ASC')
  if (result.length === 0) return []
  return result[0].values.map(row => formatProduct(row))
}

export async function getNewProducts() {
  const database = await getDb()
  const result = database.exec('SELECT * FROM products WHERE is_new = 1 AND published = 1 ORDER BY sort_order ASC')
  if (result.length === 0) return []
  return result[0].values.map(row => formatProduct(row))
}

function formatProduct(row: any[]) {
  return {
    id: row[0] as string,
    name: row[1] as string,
    description: row[2] as string,
    images: JSON.parse((row[3] as string) || '[]'),
    category: row[4] as string,
    featured: row[5] as number,
    is_new: row[6] as number,
    sort_order: row[7] as number,
    published: row[8] as number,
    image_size: row[9] as number || 450,
    created_at: row[10] as string,
    updated_at: row[11] as string,
  }
}

// === КАТЕГОРИИ ===

export async function getAllCategories() {
  const database = await getDb()
  const result = database.exec('SELECT * FROM categories ORDER BY sort_order ASC, name ASC')
  if (result.length === 0) return []
  return result[0].values.map(row => ({
    id: row[0] as number,
    name: row[1] as string,
    slug: row[2] as string,
    sort_order: row[3] as number,
  }))
}

export async function saveCategory(data: { id?: number; name: string; slug: string; sort_order?: number }) {
  const database = await getDb()

  if (data.id) {
    database.run(
      'UPDATE categories SET name = ?, slug = ?, sort_order = ? WHERE id = ?',
      [data.name, data.slug, data.sort_order ?? 0, data.id]
    )
  } else {
    database.run(
      'INSERT INTO categories (name, slug, sort_order) VALUES (?, ?, ?)',
      [data.name, data.slug, data.sort_order ?? 0]
    )
  }

  saveDb()
}

export async function deleteCategory(id: number) {
  const database = await getDb()
  database.run('DELETE FROM categories WHERE id = ?', [id])
  saveDb()
}
