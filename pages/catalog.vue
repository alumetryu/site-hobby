<script setup lang="ts">
useHead({
  title: 'Каталог — Hobby Games Tashkent'
})

const route = useRoute()
const search = ref((route.query.search as string) || '')
const selectedCategory = ref((route.query.category as string) || '')
const inStockOnly = ref(true)

const { data, pending, error, refresh } = await useFetch('/api/catalog', {
  query: {
    search,
    inStock: inStockOnly,
  },
  watch: [search, inStockOnly]
})

// Загружаем категории
const { data: categoriesData } = await useFetch('/api/categories')
const categories = computed(() => categoriesData.value?.categories || [])

const allProducts = computed(() => data.value?.products || [])

// Фильтрация по категории
const products = computed(() => {
  if (!selectedCategory.value) return allProducts.value
  return allProducts.value.filter(p => 
    p.category?.toLowerCase().includes(selectedCategory.value.toLowerCase())
  )
})

const total = computed(() => products.value.length)
</script>

<template>
  <div class="catalog-page">
    <div class="container">
      <h1 class="catalog-title">Каталог игр</h1>

      <!-- Категории -->
      <div class="catalog-categories">
        <button 
          :class="['cat-btn', { active: !selectedCategory }]"
          @click="selectedCategory = ''"
        >
          Все
        </button>
        <button 
          v-for="cat in categories"
          :key="cat.id"
          :class="['cat-btn', { active: selectedCategory === cat.name }]"
          @click="selectedCategory = selectedCategory === cat.name ? '' : cat.name"
        >
          {{ cat.name }}
        </button>
      </div>

      <!-- Фильтры -->
      <div class="catalog-filters">
        <div class="catalog-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="search"
            type="text"
            placeholder="Поиск игр..."
            class="catalog-search__input"
          />
        </div>
        <label class="catalog-stock-filter">
          <input v-model="inStockOnly" type="checkbox" />
          <span>Только в наличии</span>
        </label>
      </div>

      <!-- Счётчик -->
      <div class="catalog-count">
        {{ pending ? 'Загрузка...' : `Найдено: ${total}` }}
      </div>

      <!-- Ошибка -->
      <div v-if="error" style="text-align: center; padding: 40px;">
        <p>Ошибка загрузки каталога</p>
        <button @click="refresh" style="margin-top: 12px; padding: 10px 20px; background: var(--yellow); border: none; border-radius: 6px; cursor: pointer;">Повторить</button>
      </div>

      <!-- Загрузка -->
      <div v-else-if="pending" class="catalog-loading">
        <div class="spinner"></div>
      </div>

      <!-- Список товаров -->
      <div v-else-if="products.length" class="product-grid">
        <ProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
        />
      </div>

      <!-- Пустой результат -->
      <div v-else style="text-align: center; padding: 60px; color: var(--light-gray);">
        <p style="font-size: 1.2rem; margin-bottom: 12px;">Ничего не найдено</p>
        <button v-if="search || selectedCategory" @click="search = ''; selectedCategory = ''" style="padding: 10px 20px; background: var(--yellow); border: none; border-radius: 6px; cursor: pointer;">Сбросить фильтры</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.catalog-categories {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.cat-btn {
  padding: 8px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.cat-btn:hover {
  border-color: var(--yellow);
}

.cat-btn.active {
  background: var(--yellow);
  border-color: var(--yellow);
  font-weight: 600;
}
</style>
