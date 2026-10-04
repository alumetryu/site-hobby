<script setup lang="ts">
definePageMeta({ layout: false })

useHead({ title: 'Админ-панель — Hobby Games' })

const login = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function doLogin() {
  error.value = ''
  loading.value = true

  try {
    const data = await $fetch('/api/admin/login', {
      method: 'POST',
      body: { login: login.value, password: password.value }
    })

    if (data.success) {
      localStorage.setItem('admin_token', data.token)
      navigateTo('/admin/dashboard')
    }
  } catch (e: any) {
    error.value = e.data?.message || 'Ошибка авторизации'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="admin-login">
    <div class="admin-login__card">
      <h1>Админ-панель</h1>
      <p>Hobby Games Tashkent</p>

      <form @submit.prevent="doLogin">
        <div class="field">
          <label>Логин</label>
          <input v-model="login" type="email" placeholder="Email" required />
        </div>
        <div class="field">
          <label>Пароль</label>
          <input v-model="password" type="password" placeholder="Пароль" required />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Вход...' : 'Войти' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style>
.admin-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
  font-family: 'Ubuntu', sans-serif;
}

.admin-login__card {
  background: #fff;
  padding: 40px;
  border-radius: 12px;
  width: 400px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.2);
}

.admin-login__card h1 {
  margin: 0 0 4px;
  font-size: 1.5rem;
}

.admin-login__card p {
  color: #666;
  margin: 0 0 24px;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: #333;
}

.field input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
}

.field input:focus {
  outline: none;
  border-color: #fcc15f;
}

.error {
  color: #e74c3c;
  font-size: 0.9rem;
  margin: 8px 0;
}

button[type="submit"] {
  width: 100%;
  padding: 14px;
  background: #fcc15f;
  color: #000;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}

button[type="submit"]:hover:not(:disabled) {
  background: #f5b040;
}

button[type="submit"]:disabled {
  opacity: 0.6;
}
</style>
