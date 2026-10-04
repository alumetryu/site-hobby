<script setup lang="ts">
useHead({
  title: 'Авторизация — Hobby Games Tashkent'
})

const cardNumber = ref('')
const loading = ref(false)
const error = ref('')
const client = ref<any>(null)

// Проверяем сохранённую сессию
onMounted(() => {
  const saved = localStorage.getItem('hg_client')
  if (saved) {
    try {
      client.value = JSON.parse(saved)
    } catch {}
  }
})

async function login() {
  if (!cardNumber.value.trim()) {
    error.value = 'Введите номер карты или телефона'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const data = await $fetch('/api/auth', {
      method: 'POST',
      body: { cardNumber: cardNumber.value }
    })

    if (data.success) {
      client.value = data.client
      localStorage.setItem('hg_client', JSON.stringify(data.client))
      // Уведомляем другие компоненты об обновлении
      window.dispatchEvent(new CustomEvent('hg-auth-update'))
    }
  } catch (e: any) {
    error.value = e.data?.message || 'Ошибка авторизации'
  } finally {
    loading.value = false
  }
}

function logout() {
  client.value = null
  localStorage.removeItem('hg_client')
  window.dispatchEvent(new CustomEvent('hg-auth-update'))
}
</script>

<template>
  <div class="auth-page">
    <div class="container">
      <h1 class="auth-title">Дисконтная карта</h1>

      <!-- Форма авторизации -->
      <div v-if="!client" class="auth-form">
        <p class="auth-desc">
          Введите номер вашей дисконтной карты или привязанный телефон, чтобы увидеть цены со скидкой
        </p>

        <form @submit.prevent="login" class="auth-input-group">
          <input
            v-model="cardNumber"
            type="text"
            placeholder="Номер карты или телефона"
            class="auth-input"
            :disabled="loading"
          />
          <button type="submit" class="auth-btn" :disabled="loading">
            {{ loading ? 'Поиск...' : 'Войти' }}
          </button>
        </form>

        <p v-if="error" class="auth-error">{{ error }}</p>

        <div class="auth-help">
          <p>Нет карты? Получите её бесплатно в нашем магазине:</p>
          <address>
            Ташкент, ТРЦ Парус, 2 этаж<br />
            Тел: +998 90 902 26 20
          </address>
        </div>
      </div>

      <!-- Информация о клиенте -->
      <div v-else class="auth-profile">
        <div class="auth-profile__header">
          <div class="auth-profile__avatar">
            {{ client.name?.charAt(0) || '?' }}
          </div>
          <div>
            <h2 class="auth-profile__name">{{ client.name }}</h2>
            <p class="auth-profile__card">Карта: {{ client.discountCard || '—' }}</p>
          </div>
        </div>

        <div class="auth-profile__stats">
          <div class="auth-stat">
            <span class="auth-stat__value">{{ client.discount }}%</span>
            <span class="auth-stat__label">Ваша скидка</span>
          </div>
          <div v-if="client.birthday" class="auth-stat">
            <span class="auth-stat__value">{{ client.birthday }}</span>
            <span class="auth-stat__label">День рождения</span>
          </div>
        </div>

        <div class="auth-profile__info">
          <div v-if="client.phones?.length">
            <strong>Телефоны:</strong> {{ client.phones.join(', ') }}
          </div>
          <div v-if="client.emails?.length">
            <strong>Email:</strong> {{ client.emails.join(', ') }}
          </div>
        </div>

        <div style="padding: 16px 24px; background: #f0fff0; border-radius: 8px; margin: 0 24px 16px;">
          <p style="color: #27ae60; font-weight: 600; margin: 0;">
            Все цены на сайте отображаются с вашей скидкой {{ client.discount }}%
          </p>
        </div>

        <button class="auth-logout" @click="logout">Выйти</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  padding: 40px 0;
  min-height: 60vh;
}

.auth-title {
  font-size: 2rem;
  margin-bottom: 24px;
  text-align: center;
}

.auth-form {
  max-width: 480px;
  margin: 0 auto;
}

.auth-desc {
  text-align: center;
  color: #666;
  margin-bottom: 24px;
}

.auth-input-group {
  display: flex;
  gap: 12px;
}

.auth-input {
  flex: 1;
  padding: 14px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.auth-input:focus {
  outline: none;
  border-color: #fcc15f;
}

.auth-btn {
  padding: 14px 28px;
  background: #fcc15f;
  color: #000;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.auth-btn:hover:not(:disabled) {
  background: #f5b040;
}

.auth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-error {
  color: #e74c3c;
  margin-top: 12px;
  text-align: center;
}

.auth-help {
  margin-top: 32px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  text-align: center;
  color: #666;
}

.auth-help address {
  font-style: normal;
  margin-top: 8px;
}

.auth-profile {
  max-width: 560px;
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  overflow: hidden;
}

.auth-profile__header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: linear-gradient(135deg, #fcc15f 0%, #f5b040 100%);
}

.auth-profile__avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
}

.auth-profile__name {
  font-size: 1.3rem;
  margin: 0;
}

.auth-profile__card {
  margin: 4px 0 0;
  opacity: 0.8;
  font-size: 0.9rem;
}

.auth-profile__stats {
  display: flex;
  padding: 20px 24px;
  gap: 32px;
  border-bottom: 1px solid #eee;
}

.auth-stat__value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #fcc15f;
}

.auth-stat__label {
  font-size: 0.85rem;
  color: #999;
}

.auth-profile__info {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.95rem;
}

.auth-logout {
  display: block;
  width: 100%;
  padding: 16px;
  background: none;
  border: none;
  border-top: 1px solid #eee;
  color: #e74c3c;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.auth-logout:hover {
  background: #fff5f5;
}
</style>
