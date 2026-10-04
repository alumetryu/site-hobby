<script setup lang="ts">
const favorites = ref<number[]>([])

function toggleFavorite(id: number) {
  const idx = favorites.value.indexOf(id)
  if (idx === -1) {
    favorites.value.push(id)
  } else {
    favorites.value.splice(idx, 1)
  }
}

provide('favorites', { favorites, toggleFavorite })

// Поиск
const searchQuery = ref('')
const router = useRouter()

function doSearch() {
  if (searchQuery.value.trim()) {
    router.push({ path: '/catalog', query: { search: searchQuery.value } })
  }
}

// Авторизация
const clientName = ref('')
const isLoggedIn = ref(false)

onMounted(() => {
  updateAuthState()
  window.addEventListener('hg-auth-update', updateAuthState)
})

onUnmounted(() => {
  window.removeEventListener('hg-auth-update', updateAuthState)
})

function updateAuthState() {
  const saved = localStorage.getItem('hg_client')
  if (saved) {
    try {
      const client = JSON.parse(saved)
      clientName.value = client.name || ''
      isLoggedIn.value = true
    } catch {
      clientName.value = ''
      isLoggedIn.value = false
    }
  } else {
    clientName.value = ''
    isLoggedIn.value = false
  }
}
</script>

<template>
  <div class="app">
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="container">
        <div class="top-bar__left">
          <span>Ташкент, ТРЦ Парус, 2 этаж</span>
          <NuxtLink to="/catalog">Каталог</NuxtLink>
        </div>
        <div class="top-bar__right">
          <a href="tel:+998909022620" class="top-bar__phone">+998 90 902 26 20</a>
          <span>Пн-Вс: 10:00 — 21:00</span>
        </div>
      </div>
    </div>

    <!-- Header -->
    <header class="header">
      <div class="container">
        <NuxtLink to="/" class="logo">
          <div class="logo__icon">H</div>
          <div class="logo__text">Hobby<span>Games</span><br>Tashkent</div>
        </NuxtLink>

        <form class="search" @submit.prevent="doSearch">
          <input
            v-model="searchQuery"
            type="text"
            class="search__input"
            placeholder="Искать настольные игры, аксессуары..."
          />
          <button type="submit" class="search__btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </form>

        <div class="header__actions">
          <NuxtLink to="/auth" class="header__action">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <span>{{ isLoggedIn ? 'Аккаунт' : 'Вход' }}</span>
          </NuxtLink>
          <button class="header__action">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            <span>Избранное</span>
            <span v-if="favorites.length" class="header__action-count">{{ favorites.length }}</span>
          </button>
          <button class="header__action">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            <span>Корзина</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Navigation -->
    <nav class="nav">
      <div class="container">
        <NuxtLink to="/catalog" class="nav__catalog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
          </svg>
          Каталог
        </NuxtLink>
        <ul class="nav__links">
          <li><NuxtLink to="/catalog">Настольные игры</NuxtLink></li>
          <li><NuxtLink to="/catalog">Варгеймы</NuxtLink></li>
          <li><NuxtLink to="/catalog">Warhammer</NuxtLink></li>
          <li><NuxtLink to="/catalog">ККИ</NuxtLink></li>
          <li><NuxtLink to="/catalog">НРИ</NuxtLink></li>
          <li><NuxtLink to="/catalog">Сборные модели</NuxtLink></li>
          <li><NuxtLink to="/catalog">Аксессуары</NuxtLink></li>
        </ul>
      </div>
    </nav>

    <!-- Main Content -->
    <main>
      <slot />
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer__grid">
          <div>
            <div class="footer__title">Каталог</div>
            <ul class="footer__links">
              <li><NuxtLink to="/catalog">Настольные игры</NuxtLink></li>
              <li><NuxtLink to="/catalog">Варгеймы</NuxtLink></li>
              <li><NuxtLink to="/catalog">Warhammer</NuxtLink></li>
              <li><NuxtLink to="/catalog">Коллекционные карточные игры</NuxtLink></li>
              <li><NuxtLink to="/catalog">Ролевые игры</NuxtLink></li>
            </ul>
          </div>
          <div>
            <div class="footer__title">Покупателям</div>
            <ul class="footer__links">
              <li><a href="#">Как сделать заказ</a></li>
              <li><a href="#">Способы оплаты</a></li>
              <li><a href="#">Акции и скидки</a></li>
              <li><NuxtLink to="/auth">Дисконтная карта</NuxtLink></li>
            </ul>
          </div>
          <div>
            <div class="footer__title">Компания</div>
            <ul class="footer__links">
              <li><a href="#">О нас</a></li>
              <li><a href="#">Контакты</a></li>
              <li><a href="#">Игротеки</a></li>
            </ul>
          </div>
          <div>
            <div class="footer__title">Контакты</div>
            <ul class="footer__links">
              <li><a href="tel:+998909022620">+998 90 902 26 20</a></li>
              <li>Ташкент, ТРЦ Парус, 2 этаж</li>
              <li>Пн-Вс: 10:00 — 21:00</li>
            </ul>
          </div>
        </div>
        <div class="footer__bottom">
          <span>© 2026 Hobby Games Tashkent. Все права защищены.</span>
          <div class="footer__socials">
            <a href="https://t.me/HobbyGamesTashkent" class="footer__social" title="Telegram" target="_blank">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
