<script setup lang="ts">
definePageMeta({ layout: false })

useHead({ title: 'Админ-панель — Hobby Games' })

const search = ref('')
const selectedCategory = ref('')
const products = ref<any[]>([])
const categories = ref<any[]>([])
const cloudCatalog = ref<any[]>([])
const loading = ref(true)
const activeTab = ref('cloud')

// Пагинация
const cloudPage = ref(0)
const cloudPerPage = 100

onMounted(() => {
  const token = localStorage.getItem('admin_token')
  if (!token) { navigateTo('/admin'); return }
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    await Promise.all([loadProducts(), loadCategories(), loadCatalog()])
  } finally { loading.value = false }
}

async function loadProducts() {
  try {
    const data = await $fetch(`/api/admin/products?search=${search.value}&category=${selectedCategory.value}`)
    products.value = data.products || []
  } catch (e) { console.error(e) }
}

async function loadCategories() {
  try {
    const data = await $fetch('/api/admin/categories')
    categories.value = data.categories || []
  } catch (e) { console.error(e) }
}

async function loadCatalog() {
  try {
    // all=true — показать ВСЕ товары включая не в наличии
    const data = await $fetch('/api/catalog?all=true')
    cloudCatalog.value = data.products || []
  } catch (e) { console.error(e) }
}

async function deleteProduct(id: string) {
  if (!confirm('Удалить товар из базы?')) return
  try {
    await $fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' })
    await loadProducts()
  } catch (e) { alert('Ошибка удаления') }
}

async function toggleFeatured(product: any) {
  try {
    await $fetch('/api/admin/products', {
      method: 'POST',
      body: { id: product.id, name: product.name, featured: product.featured ? 0 : 1 }
    })
    await loadProducts()
  } catch (e) { alert('Ошибка') }
}

async function toggleNew(product: any) {
  try {
    await $fetch('/api/admin/products', {
      method: 'POST',
      body: { id: product.id, name: product.name, is_new: product.is_new ? 0 : 1 }
    })
    await loadProducts()
  } catch (e) { alert('Ошибка') }
}

async function saveCategory(cat?: any) {
  const name = prompt('Название категории:', cat?.name || '')
  if (!name) return
  const slug = cat?.slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  try {
    await $fetch('/api/admin/categories', { method: 'POST', body: { id: cat?.id, name, slug } })
    await loadCategories()
  } catch (e) { alert('Ошибка') }
}

async function deleteCategory(id: number) {
  if (!confirm('Удалить категорию?')) return
  try {
    await $fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' })
    await loadCategories()
  } catch (e) { alert('Ошибка') }
}

function logout() {
  localStorage.removeItem('admin_token')
  navigateTo('/admin')
}

// Товары не в базе
const missingProducts = computed(() => {
  const existingIds = new Set(products.value.map(p => p.id))
  let missing = cloudCatalog.value.filter(p => !existingIds.has(p.id))
  if (search.value) {
    const q = search.value.toLowerCase()
    missing = missing.filter(p => p.name.toLowerCase().includes(q))
  }
  return missing
})

// Пагинация
const paginatedMissing = computed(() => {
  const start = cloudPage.value * cloudPerPage
  return missingProducts.value.slice(start, start + cloudPerPage)
})
const totalMissingPages = computed(() => Math.ceil(missingProducts.value.length / cloudPerPage))

watch(search, () => { cloudPage.value = 0 })
</script>

<template>
  <div class="admin">
    <header class="admin-header">
      <div class="admin-header__left">
        <span class="admin-logo">HG Admin</span>
      </div>
      <div class="admin-header__right">
        <NuxtLink to="/" target="_blank" class="btn-link">Открыть сайт</NuxtLink>
        <button @click="logout" class="btn-logout">Выйти</button>
      </div>
    </header>

    <main class="admin-main">
      <div class="admin-sidebar">
        <button @click="activeTab = 'cloud'" :class="['sidebar-link', { active: activeTab === 'cloud' }]">
          Все товары ({{ cloudCatalog.length }})
        </button>
        <button @click="activeTab = 'products'" :class="['sidebar-link', { active: activeTab === 'products' }]">
          В базе ({{ products.length }})
        </button>
        <button @click="activeTab = 'featured'" :class="['sidebar-link', { active: activeTab === 'featured' }]">
          ★ Популярные
        </button>
        <button @click="activeTab = 'new'" :class="['sidebar-link', { active: activeTab === 'new' }]">
          🆕 Новинки
        </button>
        <button @click="activeTab = 'categories'" :class="['sidebar-link', { active: activeTab === 'categories' }]">
          Категории
        </button>
      </div>

      <div class="admin-content">
        <!-- ВСЕ ТОВАРЫ ИЗ CLOUDSHOP -->
        <div v-if="activeTab === 'cloud'">
          <h1>Все товары из Cloudshop</h1>
          <p style="color: #666; margin-bottom: 16px;">Все {{ cloudCatalog.length }} товаров, включая не в наличии. Нажмите ✏️ чтобы добавить в базу.</p>

          <div class="toolbar">
            <div class="search-box">
              <input v-model="search" type="text" placeholder="Поиск..." />
            </div>
            <div class="stats">
              Найдено: {{ missingProducts.length }} | Стр. {{ cloudPage + 1 }} из {{ totalMissingPages }}
            </div>
          </div>

          <div v-if="loading" class="loading">Загрузка...</div>
          <div v-else>
            <div class="product-list">
              <div v-for="p in paginatedMissing" :key="p.id" class="product-item">
                <div class="product-item__info">
                  <div class="product-item__name">{{ p.name }}</div>
                  <div class="product-item__meta">
                    {{ p.price?.toLocaleString() }} сум | Склад: {{ p.stock }}
                    <span v-if="p.stock <= 0" style="color: #e74c3c;">нет в наличии</span>
                  </div>
                </div>
                <div class="product-item__actions">
                  <NuxtLink :to="`/admin/product/${p.id}`" class="btn-edit">✏️</NuxtLink>
                </div>
              </div>
            </div>

            <div v-if="totalMissingPages > 1" class="pagination">
              <button @click="cloudPage--" :disabled="cloudPage === 0" class="btn-page">←</button>
              <span>{{ cloudPage + 1 }} / {{ totalMissingPages }}</span>
              <button @click="cloudPage++" :disabled="cloudPage >= totalMissingPages - 1" class="btn-page">→</button>
            </div>
          </div>
        </div>

        <!-- ТОВАРЫ В БАЗЕ -->
        <div v-if="activeTab === 'products'">
          <h1>Товары в базе</h1>
          <div class="toolbar">
            <div class="search-box">
              <input v-model="search" type="text" placeholder="Поиск..." @keyup.enter="loadProducts" />
              <button @click="loadProducts">Найти</button>
            </div>
            <select v-model="selectedCategory" @change="loadProducts" class="category-select">
              <option value="">Все категории</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
            </select>
          </div>

          <div v-if="loading" class="loading">Загрузка...</div>
          <div v-else-if="products.length" class="product-list">
            <div v-for="p in products" :key="p.id" class="product-item">
              <div class="product-item__image">
                <img v-if="p.images?.length" :src="p.images[0]" />
                <div v-else class="no-image">📷</div>
              </div>
              <div class="product-item__info">
                <div class="product-item__name">{{ p.name }}</div>
                <div class="product-item__meta">
                  {{ p.category || '—' }} | Фото: {{ p.images?.length || 0 }}
                  <span v-if="p.featured" class="badge-star">★</span>
                  <span v-if="p.is_new" class="badge-new">NEW</span>
                </div>
              </div>
              <div class="product-item__actions">
                <button @click="toggleFeatured(p)" :class="['btn-star', { active: p.featured }]" title="Популярное">★</button>
                <button @click="toggleNew(p)" :class="['btn-new', { active: p.is_new }]" title="Новинка">🆕</button>
                <NuxtLink :to="`/admin/product/${p.id}`" class="btn-edit">✏️</NuxtLink>
                <button @click="deleteProduct(p.id)" class="btn-delete">🗑️</button>
              </div>
            </div>
          </div>
          <div v-else class="empty">Нет товаров в базе</div>
        </div>

        <!-- ПОПУЛЯРНЫЕ -->
        <div v-if="activeTab === 'featured'">
          <h1>Популярные товары (на главной)</h1>
          <p style="color: #666; margin-bottom: 16px;">Товары с ★ — отображаются на главной в разделе "Популярные"</p>

          <div v-if="products.filter(p => p.featured).length" class="product-list">
            <div v-for="p in products.filter(p => p.featured)" :key="p.id" class="product-item">
              <div class="product-item__image">
                <img v-if="p.images?.length" :src="p.images[0]" />
                <div v-else class="no-image">📷</div>
              </div>
              <div class="product-item__info">
                <div class="product-item__name">{{ p.name }}</div>
              </div>
              <div class="product-item__actions">
                <button @click="toggleFeatured(p)" class="btn-star active">★</button>
                <NuxtLink :to="`/admin/product/${p.id}`" class="btn-edit">✏️</NuxtLink>
              </div>
            </div>
          </div>
          <div v-else class="empty">Нет популярных товаров. Добавьте ★ во вкладке "В базе"</div>
        </div>

        <!-- НОВИНКИ -->
        <div v-if="activeTab === 'new'">
          <h1>Новинки (на главной)</h1>
          <p style="color: #666; margin-bottom: 16px;">Товары с 🆕 — отображаются на главной в разделе "Новинки"</p>

          <div v-if="products.filter(p => p.is_new).length" class="product-list">
            <div v-for="p in products.filter(p => p.is_new)" :key="p.id" class="product-item">
              <div class="product-item__image">
                <img v-if="p.images?.length" :src="p.images[0]" />
                <div v-else class="no-image">📷</div>
              </div>
              <div class="product-item__info">
                <div class="product-item__name">{{ p.name }}</div>
              </div>
              <div class="product-item__actions">
                <button @click="toggleNew(p)" class="btn-new active">🆕</button>
                <NuxtLink :to="`/admin/product/${p.id}`" class="btn-edit">✏️</NuxtLink>
              </div>
            </div>
          </div>
          <div v-else class="empty">Нет новинок. Добавьте 🆕 во вкладке "В базе"</div>
        </div>

        <!-- КАТЕГОРИИ -->
        <div v-if="activeTab === 'categories'">
          <h1>Категории</h1>
          <button @click="saveCategory()" class="btn-add-cat">+ Добавить</button>
          <div class="category-list">
            <div v-for="cat in categories" :key="cat.id" class="category-item">
              <div class="category-item__info">
                <div class="category-item__name">{{ cat.name }}</div>
                <div class="category-item__slug">{{ cat.slug }}</div>
              </div>
              <div class="category-item__actions">
                <button @click="saveCategory(cat)" class="btn-edit">✏️</button>
                <button @click="deleteCategory(cat.id)" class="btn-delete">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style>
.admin { min-height: 100vh; background: #f5f5f5; font-family: 'Ubuntu', sans-serif; }
.admin-header { background: #1a1a1a; color: #fff; padding: 0 24px; height: 56px; display: flex; align-items: center; justify-content: space-between; }
.admin-logo { color: #fcc15f; font-weight: 700; font-size: 1.2rem; }
.admin-header__right { display: flex; gap: 16px; align-items: center; }
.btn-link { color: #fcc15f; text-decoration: none; font-size: 0.9rem; }
.btn-logout { background: none; border: 1px solid #666; color: #fff; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
.admin-main { display: flex; min-height: calc(100vh - 56px); }
.admin-sidebar { width: 220px; background: #fff; border-right: 1px solid #e0e0e0; padding: 16px 0; display: flex; flex-direction: column; }
.sidebar-link { display: block; padding: 10px 20px; color: #333; background: none; border: none; text-align: left; cursor: pointer; width: 100%; border-right: 3px solid transparent; font-size: 0.85rem; }
.sidebar-link:hover, .sidebar-link.active { background: #fcc15f20; color: #fcc15f; border-right-color: #fcc15f; }
.admin-content { flex: 1; padding: 24px; overflow-x: auto; }
.admin-content h1 { font-size: 1.4rem; margin: 0 0 20px; }
.toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
.search-box { display: flex; gap: 8px; }
.search-box input { padding: 8px 12px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 0.85rem; width: 250px; }
.search-box button { padding: 8px 16px; background: #fcc15f; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
.category-select { padding: 8px 12px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 0.85rem; }
.stats { color: #666; font-size: 0.85rem; }
.product-list { display: flex; flex-direction: column; gap: 6px; }
.product-item { display: flex; align-items: center; gap: 12px; background: #fff; padding: 10px 14px; border-radius: 8px; border: 1px solid #e0e0e0; }
.product-item__image { width: 44px; height: 44px; border-radius: 6px; overflow: hidden; flex-shrink: 0; background: #f5f5f5; }
.product-item__image img { width: 100%; height: 100%; object-fit: cover; }
.no-image { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.product-item__info { flex: 1; min-width: 0; }
.product-item__name { font-weight: 600; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.product-item__meta { font-size: 0.75rem; color: #999; margin-top: 2px; }
.badge-star { background: #fcc15f; color: #000; padding: 1px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; margin-left: 4px; }
.badge-new { background: #27ae60; color: #fff; padding: 1px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; margin-left: 4px; }
.product-item__actions { display: flex; gap: 6px; align-items: center; }
.btn-star, .btn-new, .btn-edit, .btn-delete { width: 32px; height: 32px; border: 1px solid #e0e0e0; border-radius: 6px; background: none; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; text-decoration: none; }
.btn-star:hover { border-color: #fcc15f; }
.btn-star.active { background: #fcc15f; border-color: #fcc15f; }
.btn-new:hover { border-color: #27ae60; }
.btn-new.active { background: #27ae60; border-color: #27ae60; }
.btn-edit:hover { border-color: #fcc15f; background: #fcc15f20; }
.btn-delete:hover { border-color: #e74c3c; background: #e74c3c20; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 24px; }
.btn-page { padding: 8px 20px; background: #fcc15f; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-page:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-add-cat { padding: 10px 20px; background: #27ae60; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; margin-bottom: 20px; }
.category-list { display: flex; flex-direction: column; gap: 6px; }
.category-item { display: flex; align-items: center; gap: 12px; background: #fff; padding: 12px 14px; border-radius: 8px; border: 1px solid #e0e0e0; }
.category-item__info { flex: 1; }
.category-item__name { font-weight: 600; font-size: 0.9rem; }
.category-item__slug { font-size: 0.75rem; color: #999; }
.category-item__actions { display: flex; gap: 6px; }
.loading { text-align: center; padding: 40px; color: #666; }
.empty { text-align: center; padding: 40px; color: #666; background: #fff; border-radius: 8px; border: 1px dashed #e0e0e0; }
</style>
