<script setup lang="ts">
interface Product {
  id: string
  name: string
  price: number
  oldPrice?: number
  image?: string
  badge?: 'new' | 'sale' | 'hit'
  category?: string
  stock: number
  rating?: number
  reviews?: number
}

const props = defineProps<{ product: Product }>()

const { favorites, toggleFavorite } = inject<any>('favorites', { favorites: ref([]), toggleFavorite: () => {} })

const isFavorite = computed(() => favorites.value.includes(props.product.id))

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
  if (clientDiscount.value > 0) {
    return Math.round(props.product.price * (1 - clientDiscount.value / 100))
  }
  return props.product.price
})

const formattedPrice = computed(() => {
  return discountedPrice.value.toLocaleString('ru-RU') + ' сум'
})

const formattedOriginalPrice = computed(() => {
  if (clientDiscount.value > 0) {
    return props.product.price.toLocaleString('ru-RU') + ' сум'
  }
  if (props.product.oldPrice) {
    return props.product.oldPrice.toLocaleString('ru-RU') + ' сум'
  }
  return null
})

const badgeLabel = computed(() => {
  if (clientDiscount.value > 0) return `-${clientDiscount.value}%`
  switch (props.product.badge) {
    case 'new': return 'Новинка'
    case 'sale': return 'Скидка'
    case 'hit': return 'Хит'
    default: return null
  }
})

// Определяем иконку по названию товара
const productIcon = computed(() => {
  const name = props.product.name.toLowerCase()
  if (name.includes('кубик') || name.includes('dice')) return '🎲'
  if (name.includes('карточн') || name.includes('card')) return '🃏'
  if (name.includes('настольн') || name.includes('game')) return '🎯'
  if (name.includes('аксессуар') || name.includes('протектор')) return '🛡️'
  if (name.includes('фигурк') || name.includes('figur')) return '⚔️'
  if (name.includes('пазл') || name.includes('puzzle')) return '🧩'
  if (name.includes('модел') || name.includes('model')) return '✈️'
  return '🎮'
})
</script>

<template>
  <NuxtLink :to="`/game/${product.id}`" class="product-card">
    <div class="product-card__image">
      <img
        v-if="product.image"
        :src="product.image"
        :alt="product.name"
        loading="lazy"
      />
      <div v-else class="product-card__placeholder">
        <span class="product-card__icon">{{ productIcon }}</span>
      </div>

      <div v-if="badgeLabel" class="product-card__badges">
        <span class="product-card__badge" :class="clientDiscount > 0 ? 'product-card__badge--sale' : `product-card__badge--${product.badge}`">
          {{ badgeLabel }}
        </span>
      </div>

      <button
        class="product-card__favorite"
        :class="{ active: isFavorite }"
        @click.prevent="toggleFavorite(product.id)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      </button>
    </div>

    <div class="product-card__body">
      <div v-if="product.category" class="product-card__category">{{ product.category }}</div>
      <div class="product-card__name">{{ product.name }}</div>

      <div class="product-card__footer">
        <div class="product-card__prices">
          <span class="product-card__price">{{ formattedPrice }}</span>
          <span v-if="formattedOriginalPrice" class="product-card__price-old">{{ formattedOriginalPrice }}</span>
        </div>
        <button class="product-card__cart-btn" title="В корзину" @click.prevent="">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
        </button>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.product-card__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  width: 100%;
  height: 100%;
}

.product-card__icon {
  font-size: 3rem;
  opacity: 0.6;
}
</style>
