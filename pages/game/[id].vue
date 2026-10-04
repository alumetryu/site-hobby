<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string

const { data, error } = await useFetch(`/api/product?id=${id}`)

useHead({
  title: computed(() => data.value?.product?.name || 'Товар — Hobby Games')
})

const product = computed(() => data.value?.product)

// Размер картинки из базы (или 450 по умолчанию)
const imageSize = computed(() => product.value?.image_size || 450)

// Галерея
const currentImage = ref(0)
const allImages = computed(() => {
  if (!product.value) return []
  if (product.value.images?.length) return product.value.images
  if (product.value.image) return [product.value.image]
  return []
})

function selectImage(idx: number) {
  currentImage.value = idx
}

// Скидка клиента
const clientDiscount = ref(0)

onMounted(() => {
  updateDiscount()
  window.addEventListener('hg-auth-update', updateDiscount)
})

onUnmounted(() => {
  window.removeEventListener('hg-auth-update', updateDiscount)
})

function updateDiscount() {
  const saved = localStorage.getItem('hg_client')
  if (saved) {
    try {
      const client = JSON.parse(saved)
      clientDiscount.value = client.discount || 0
    } catch {
      clientDiscount.value = 0
    }
  } else {
    clientDiscount.value = 0
  }
}

const discountedPrice = computed(() => {
  if (!product.value) return 0
  if (clientDiscount.value > 0) {
    return Math.round(product.value.price * (1 - clientDiscount.value / 100))
  }
  return product.value.price
})

const formattedPrice = computed(() => {
  return discountedPrice.value.toLocaleString('ru-RU') + ' сум'
})

const formattedOriginalPrice = computed(() => {
  if (!product.value) return null
  if (clientDiscount.value > 0) {
    return product.value.price.toLocaleString('ru-RU') + ' сум'
  }
  return null
})

const stockLabel = computed(() => {
  if (!product.value) return ''
  const s = product.value.stock
  if (s > 10) return 'В наличии'
  if (s > 0) return `Осталось ${s} шт.`
  return 'Нет в наличии'
})

const stockClass = computed(() => {
  if (!product.value) return ''
  const s = product.value.stock
  if (s > 10) return 'in-stock'
  if (s > 0) return 'low-stock'
  return 'out-of-stock'
})

const descriptionHtml = computed(() => {
  if (!product.value?.description) return ''
  const desc = product.value.description
  if (desc.includes('<') && desc.includes('>')) return desc
  return desc.split('\n').filter(Boolean).map(p => `<p>${p}</p>`).join('')
})
</script>

<template>
  <div class="game-page">
    <div class="container">
      <!-- Хлебные крошки -->
      <nav class="breadcrumbs">
        <NuxtLink to="/">Главная</NuxtLink>
        <span>/</span>
        <NuxtLink to="/catalog">Каталог</NuxtLink>
        <span>/</span>
        <span>{{ product?.name || 'Загрузка...' }}</span>
      </nav>

      <!-- Ошибка -->
      <div v-if="error" style="text-align: center; padding: 60px;">
        <h2 style="font-size: 1.5rem; margin-bottom: 12px;">Товар не найден</h2>
        <p style="color: var(--gray); margin-bottom: 16px;">{{ error.data?.message || 'Произошла ошибка' }}</p>
        <NuxtLink to="/catalog" style="display: inline-block; padding: 12px 24px; background: var(--yellow); color: var(--black); border-radius: 8px; font-weight: 600;">Вернуться в каталог</NuxtLink>
      </div>

      <!-- Карточка товара -->
      <div v-else-if="product">
        <div class="game-card">
          <!-- Галерея (слева) -->
          <div class="game-gallery">
            <!-- Лента миниатюр слева -->
            <div v-if="allImages.length > 1" class="game-gallery__thumbs-left">
              <button
                v-for="(img, i) in allImages"
                :key="i"
                class="game-gallery__thumb"
                :class="{ active: i === currentImage }"
                @click="selectImage(i)"
              >
                <img :src="img" :alt="`${product.name} ${i + 1}`" />
              </button>
            </div>

            <!-- Основная картинка -->
            <div class="game-gallery__main" :style="{ maxHeight: imageSize + 'px' }">
              <img
                v-if="allImages.length"
                :src="allImages[currentImage]"
                :alt="product.name"
                :style="{ maxHeight: imageSize + 'px' }"
              />
              <div v-else class="game-gallery__placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Информация (справа) -->
          <div class="game-info">
            <div v-if="product.category" class="game-info__category">{{ product.category }}</div>
            <h1 class="game-info__title">{{ product.name }}</h1>

            <div class="game-info__meta">
              <span v-if="product.code" class="game-info__code">Артикул: {{ product.code }}</span>
              <span :class="['game-info__stock', stockClass]">{{ stockLabel }}</span>
            </div>

            <div class="game-info__price-block">
              <span class="game-info__price">{{ formattedPrice }}</span>
              <span v-if="formattedOriginalPrice" class="game-info__price-old">{{ formattedOriginalPrice }}</span>
              <span v-if="clientDiscount > 0" class="game-info__discount">-{{ clientDiscount }}%</span>
            </div>

            <div class="game-info__actions">
              <button class="btn-cart" :disabled="product.stock <= 0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
                {{ product.stock > 0 ? 'В корзину' : 'Нет в наличии' }}
              </button>
              <button class="btn-favorite" title="В избранное">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </button>
            </div>

            <!-- Характеристики -->
            <div class="game-info__specs">
              <h3>Характеристики</h3>
              <table>
                <tbody>
                  <tr v-if="product.type">
                    <td>Тип</td>
                    <td>{{ product.type }}</td>
                  </tr>
                  <tr v-if="product.category">
                    <td>Категория</td>
                    <td>{{ product.category }}</td>
                  </tr>
                  <tr v-if="product.barcode">
                    <td>Штрихкод</td>
                    <td>{{ product.barcode }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="product.hobbygamesUrl" style="margin-top: 16px;">
              <a :href="product.hobbygamesUrl" target="_blank" style="color: var(--yellow); font-size: 0.9rem;">
                Смотреть на hobbygames.ru →
              </a>
            </div>
          </div>
        </div>

        <!-- Описание (на всю ширину внизу) -->
        <div v-if="product.description" class="game-description">
          <h2 class="game-description__title">Описание</h2>
          <div class="game-description__content" v-html="descriptionHtml" />
        </div>
      </div>

      <!-- Загрузка -->
      <div v-else class="catalog-loading">
        <div class="spinner"></div>
        <p style="margin-top: 16px; color: var(--light-gray);">Загрузка товара...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-page {
  padding: 24px 0 60px;
}

.breadcrumbs {
  display: flex;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--light-gray);
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.breadcrumbs a {
  color: var(--gray);
}

.breadcrumbs a:hover {
  color: var(--yellow);
}

.game-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  margin-bottom: 48px;
}

@media (max-width: 768px) {
  .game-card {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

/* Галерея — миниатюры слева */
.game-gallery {
  display: flex;
  gap: 12px;
}

.game-gallery__thumbs-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 500px;
  overflow-y: auto;
}

.game-gallery__thumb {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  flex-shrink: 0;
  background: var(--white);
  padding: 4px;
  transition: border-color 0.2s;
}

.game-gallery__thumb.active,
.game-gallery__thumb:hover {
  border-color: var(--yellow);
}

.game-gallery__thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.game-gallery__main {
  flex: 1;
  background: var(--white);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-gallery__main img {
  max-width: 100%;
  object-fit: contain;
}

.game-gallery__placeholder {
  color: #ddd;
  padding: 40px;
}

.game-gallery__placeholder svg {
  width: 80px;
  height: 80px;
}

.game-info__category {
  font-size: 0.85rem;
  color: var(--yellow);
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 8px;
}

.game-info__title {
  font-size: 1.6rem;
  line-height: 1.3;
  margin: 0 0 16px;
}

.game-info__meta {
  display: flex;
  gap: 16px;
  font-size: 0.9rem;
  color: var(--light-gray);
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.game-info__stock.in-stock { color: var(--green); }
.game-info__stock.low-stock { color: var(--orange); }
.game-info__stock.out-of-stock { color: var(--red); }

.game-info__price-block {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 24px;
}

.game-info__price {
  font-size: 1.8rem;
  font-weight: 700;
}

.game-info__price-old {
  font-size: 1.1rem;
  color: var(--light-gray);
  text-decoration: line-through;
}

.game-info__discount {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--red);
  background: #fde8e8;
  padding: 4px 10px;
  border-radius: 6px;
}

.game-info__actions {
  display: flex;
  gap: 12px;
  margin-bottom: 28px;
}

.btn-cart {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 20px;
  background: var(--yellow);
  color: var(--black);
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-cart:hover:not(:disabled) {
  background: var(--yellow-hover);
}

.btn-cart:disabled {
  background: var(--border);
  color: var(--light-gray);
  cursor: not-allowed;
}

.btn-cart svg {
  width: 20px;
  height: 20px;
}

.btn-favorite {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--border);
  border-radius: 8px;
  transition: all 0.2s;
  color: #ccc;
}

.btn-favorite:hover {
  border-color: var(--red);
  color: var(--red);
}

.btn-favorite svg {
  width: 20px;
  height: 20px;
}

.game-info__specs h3 {
  font-size: 1rem;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.game-info__specs table {
  width: 100%;
  border-collapse: collapse;
}

.game-info__specs td {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
}

.game-info__specs td:first-child {
  color: var(--light-gray);
  width: 120px;
}

/* Описание */
.game-description {
  background: var(--white);
  border-radius: 12px;
  padding: 32px;
  margin-top: 16px;
}

.game-description__title {
  font-size: 1.3rem;
  margin: 0 0 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--yellow);
}

.game-description__content {
  line-height: 1.7;
  color: var(--gray);
}

.game-description__content :deep(p) {
  margin-bottom: 16px;
}

.game-description__content :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 16px 0;
}

.game-description__content :deep(h3),
.game-description__content :deep(h4) {
  color: var(--black);
  margin: 24px 0 12px;
}
</style>
