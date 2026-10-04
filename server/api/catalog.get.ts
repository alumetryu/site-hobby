/**
 * GET /api/catalog — получить каталог товаров из CloudShop
 */

import { fetchCatalog, searchProducts, STORE_ID } from '../utils/cloudshop'
import { getProduct } from '../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = (query.search as string) || ''
  const inStock = query.inStock === 'true'
  const all = query.all === 'true' // показать ВСЕ товары (для админки)

  try {
    let products = search ? await searchProducts(search) : await fetchCatalog()

    // Фильтр по наличию (только если не запрошены все товары)
    if (inStock && !all) {
      products = products.filter(item => (item.stock?.[STORE_ID] || 0) > 0)
    }

    // Загружаем данные из базы для первых 200 товаров
    const limit = all ? products.length : 200
    const enrichedProducts = await Promise.all(
      products.slice(0, limit).map(async (item) => {
        const dbProduct = await getProduct(item._id)
        return {
          id: item._id,
          name: dbProduct?.name || item.name,
          price: item.price,
          stock: item.stock?.[STORE_ID] || 0,
          code: item.code,
          type: item.type,
          barcode: item.barcode,
          image: dbProduct?.images?.[0] || '',
          images: dbProduct?.images || [],
          description: dbProduct?.description || '',
          category: dbProduct?.category || '',
        }
      })
    )

    const restProducts = products.slice(limit).map(item => ({
      id: item._id,
      name: item.name,
      price: item.price,
      stock: item.stock?.[STORE_ID] || 0,
      code: item.code,
      type: item.type,
      barcode: item.barcode,
      image: '',
      images: [],
      description: '',
      category: '',
    }))

    return {
      success: true,
      total: products.length,
      products: [...enrichedProducts, ...restProducts],
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      products: []
    }
  }
})
