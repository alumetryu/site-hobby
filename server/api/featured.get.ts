/**
 * GET /api/featured — получить избранные и новые товары для главной страницы
 */

import { getFeaturedProducts, getNewProducts } from '../utils/db'
import { fetchCatalog, STORE_ID } from '../utils/cloudshop'

export default defineEventHandler(async () => {
  try {
    const [featured, newProducts] = await Promise.all([
      getFeaturedProducts(),
      getNewProducts(),
    ])

    const catalog = await fetchCatalog()

    const enrichProducts = (dbProducts: any[]) => {
      return dbProducts.map(fp => {
        const cloudItem = catalog.find(c => c._id === fp.id)
        return {
          id: fp.id,
          name: fp.name,
          price: cloudItem?.price || 0,
          stock: cloudItem?.stock?.[STORE_ID] || 0,
          image: fp.images?.[0] || '',
          images: fp.images || [],
          category: fp.category || '',
        }
      })
    }

    return { 
      success: true, 
      featured: enrichProducts(featured),
      newProducts: enrichProducts(newProducts),
    }
  } catch (error: any) {
    return { success: false, featured: [], newProducts: [] }
  }
})
