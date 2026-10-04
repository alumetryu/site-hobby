<script setup lang="ts">
useHead({
  title: 'Hobby Games Tashkent — Магазин настольных игр в Ташкенте'
})

// Загружаем избранные и новые товары из базы
const { data: featuredData } = await useFetch('/api/featured')
const { data: catalogData } = await useFetch('/api/catalog', { query: { inStock: 'true' } })

const featuredProducts = computed(() => featuredData.value?.featured || [])
const newProducts = computed(() => featuredData.value?.newProducts || [])
const catalogProducts = computed(() => catalogData.value?.products || [])

// Если нет избранных — показываем первые из каталога
const popularProducts = computed(() => {
  if (featuredProducts.value.length > 0) return featuredProducts.value
  return catalogProducts.value.slice(0, 8)
})

// Если нет новинок — показываем следующие из каталога
const displayNewProducts = computed(() => {
  if (newProducts.value.length > 0) return newProducts.value
  return catalogProducts.value.slice(8, 16)
})

// Баннеры
const banners = [
  {
    title: 'Добро пожаловать в Hobby Games!',
    subtitle: 'Лучший магазин настольных игр в Ташкенте',
    btn: 'Перейти в каталог',
    link: '/catalog',
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
  },
  {
    title: 'Скидки до 40%!',
    subtitle: 'Успейте купить популярные настольные игры',
    btn: 'Смотреть акции',
    link: '/catalog',
    bg: 'linear-gradient(135deg, #2d1b00 0%, #4a2c00 100%)'
  }
]

const currentBanner = ref(0)
function nextBanner() { currentBanner.value = (currentBanner.value + 1) % banners.length }
let bannerInterval: ReturnType<typeof setInterval>
onMounted(() => { bannerInterval = setInterval(nextBanner, 5000) })
onUnmounted(() => { clearInterval(bannerInterval) })

// Категории из базы
const { data: categoriesData } = await useFetch('/api/categories')
const categories = computed(() => categoriesData.value?.categories || [])
</script>

<template>
  <div>
    <!-- Banner -->
    <section class="banner">
      <div class="banner__slider" :style="{ transform: `translateX(-${currentBanner * 100}%)` }">
        <div v-for="(banner, i) in banners" :key="i" class="banner__slide" :style="{ background: banner.bg }">
          <div class="container">
            <div class="banner__content">
              <h1 class="banner__title">{{ banner.title }}</h1>
              <p class="banner__subtitle">{{ banner.subtitle }}</p>
              <NuxtLink :to="banner.link" class="banner__btn">{{ banner.btn }}</NuxtLink>
            </div>
          </div>
        </div>
      </div>
      <div class="banner__dots">
        <button v-for="(_, i) in banners" :key="i" class="banner__dot" :class="{ active: i === currentBanner }" @click="currentBanner = i" />
      </div>
    </section>

    <div class="container">
      <!-- Категории -->
      <section class="section">
        <div class="section__header">
          <h2 class="section__title">Каталог</h2>
          <NuxtLink to="/catalog" class="section__more">Смотреть все →</NuxtLink>
        </div>
        <div class="category-grid">
          <NuxtLink v-for="cat in categories" :key="cat.id" :to="`/catalog?category=${cat.name}`" class="category-card">
            <div class="category-card__icon">🎮</div>
            <div class="category-card__name">{{ cat.name }}</div>
          </NuxtLink>
        </div>
      </section>

      <!-- Популярные -->
      <section v-if="popularProducts.length" class="section">
        <div class="section__header">
          <h2 class="section__title">Популярные товары</h2>
          <NuxtLink to="/catalog" class="section__more">Все товары →</NuxtLink>
        </div>
        <div class="product-grid">
          <ProductCard v-for="product in popularProducts" :key="product.id" :product="product" />
        </div>
      </section>

      <!-- Новинки -->
      <section v-if="displayNewProducts.length" class="section">
        <div class="section__header">
          <h2 class="section__title">Новинки</h2>
          <NuxtLink to="/catalog" class="section__more">Все новинки →</NuxtLink>
        </div>
        <div class="product-grid">
          <ProductCard v-for="product in displayNewProducts" :key="product.id" :product="product" />
        </div>
      </section>

      <!-- Инфо -->
      <section class="section" style="margin-bottom: 60px;">
        <div style="background: var(--white); border-radius: 12px; padding: 32px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; text-align: center;">
          <div><div style="font-size: 2rem; margin-bottom: 8px;">🚚</div><div style="font-weight: 600;">Быстрая доставка</div><div style="font-size: 0.9rem; color: var(--gray);">По всему Ташкенту</div></div>
          <div><div style="font-size: 2rem; margin-bottom: 8px;">💳</div><div style="font-weight: 600;">Дисконтная карта</div><div style="font-size: 0.9rem; color: var(--gray);">Накопительная скидка</div></div>
          <div><div style="font-size: 2rem; margin-bottom: 8px;">🎮</div><div style="font-weight: 600;">Игротеки</div><div style="font-size: 0.9rem; color: var(--gray);">Попробуйте перед покупкой</div></div>
        </div>
      </section>
    </div>
  </div>
</template>
