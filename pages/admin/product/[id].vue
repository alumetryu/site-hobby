<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const id = route.params.id as string

useHead({ title: 'Редактирование товара — Админ-панель' })

const loading = ref(true)
const saving = ref(false)
const uploading = ref(false)
const cloudProduct = ref<any>(null)
const editorRef = ref<HTMLElement | null>(null)
const categories = ref<any[]>([])

// Форма
const form = ref({
  name: '',
  description: '',
  images: [] as string[],
  category: '',
  published: 1,
  image_size: 450, // размер картинки в px
})

// Сообщение о статусе
const statusMsg = ref('')
const statusType = ref<'success' | 'error' | ''>('')

function showStatus(msg: string, type: 'success' | 'error' = 'success') {
  statusMsg.value = msg
  statusType.value = type
  setTimeout(() => { statusMsg.value = ''; statusType.value = '' }, 3000)
}

onMounted(async () => {
  const token = localStorage.getItem('admin_token')
  if (!token) {
    navigateTo('/admin')
    return
  }
  await loadData()
})

async function loadData() {
  loading.value = true
  try {
    // Загружаем товар из базы
    const dbData = await $fetch(`/api/admin/product?id=${id}`)
    if (dbData.product) {
      form.value = {
        name: dbData.product.name || '',
        description: dbData.product.description || '',
        images: dbData.product.images || [],
        category: dbData.product.category || '',
        published: dbData.product.published ?? 1,
        image_size: dbData.product.image_size || 450,
      }
    }

    // Загружаем данные из Cloudshop
    const catalogData = await $fetch('/api/catalog?all=true')
    cloudProduct.value = catalogData.products?.find((p: any) => p.id === id)

    if (!form.value.name && cloudProduct.value) {
      form.value.name = cloudProduct.value.name
    }

    // Загружаем категории
    const catData = await $fetch('/api/admin/categories')
    categories.value = catData.categories || []
  } catch (e) {
    console.error('Ошибка загрузки:', e)
    showStatus('Ошибка загрузки данных', 'error')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  statusMsg.value = ''

  // Сохраняем содержимое редактора
  if (editorRef.value) {
    form.value.description = editorRef.value.innerHTML
  }

  try {
    const result = await $fetch('/api/admin/products', {
      method: 'POST',
      body: {
        id,
        name: form.value.name,
        description: form.value.description,
        images: form.value.images,
        category: form.value.category,
        published: form.value.published,
        image_size: form.value.image_size,
      }
    })
    
    if (result.success) {
      showStatus('Сохранено!', 'success')
    } else {
      showStatus('Ошибка: ' + (result.error || 'Неизвестная ошибка'), 'error')
    }
  } catch (e: any) {
    console.error('Ошибка сохранения:', e)
    showStatus('Ошибка сохранения: ' + (e.message || ''), 'error')
  } finally {
    saving.value = false
  }
}

async function uploadImage(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  uploading.value = true
  try {
    for (const file of input.files) {
      const formData = new FormData()
      formData.append('file', file)
      const data = await $fetch('/api/admin/upload', { method: 'POST', body: formData })
      if (data.url) form.value.images.push(data.url)
    }
    showStatus(`Загружено ${input.files.length} фото`)
  } catch (e) {
    showStatus('Ошибка загрузки файла', 'error')
  } finally {
    uploading.value = false
    input.value = ''
  }
}

function addImageUrl() {
  const url = prompt('Введите URL изображения:')
  if (url) form.value.images.push(url)
}

function removeImage(index: number) {
  form.value.images.splice(index, 1)
}

function onEditorInput(e: Event) {
  const target = e.target as HTMLElement
  form.value.description = target.innerHTML
}

function insertEditorImage() {
  const url = prompt('URL изображения:')
  if (url) {
    document.execCommand('insertHTML', false, `<img src="${url}" style="max-width: 100%; margin: 10px 0;" />`)
  }
}

// Импорт с hobbygames.ru
const importUrl = ref('')
const importing = ref(false)

async function importFromHobbygames() {
  if (!importUrl.value.trim()) return
  importing.value = true
  try {
    const data = await $fetch(`/api/admin/scrape?url=${encodeURIComponent(importUrl.value)}`)
    if (data.images?.length) {
      form.value.images = [...form.value.images, ...data.images]
    }
    if (data.description) {
      form.value.description = data.description
      if (editorRef.value) {
        editorRef.value.innerHTML = data.description
      }
    }
    showStatus(`Загружено: ${data.images?.length || 0} фото`)
  } catch (e) {
    showStatus('Ошибка загрузки с hobbygames.ru', 'error')
  } finally {
    importing.value = false
  }
}

// Копировать ID в буфер
function copyId() {
  navigator.clipboard.writeText(id)
  showStatus('ID скопирован')
}
</script>

<template>
  <div class="admin">
    <header class="admin-header">
      <div class="admin-header__left">
        <NuxtLink to="/admin/dashboard" class="admin-logo">← Назад</NuxtLink>
      </div>
      <div class="admin-header__center">
        <span v-if="statusMsg" :class="['status-msg', statusType]">{{ statusMsg }}</span>
      </div>
      <div class="admin-header__right">
        <button @click="save" class="btn-save" :disabled="saving">
          {{ saving ? 'Сохранение...' : '💾 Сохранить' }}
        </button>
      </div>
    </header>

    <main class="admin-main">
      <div class="admin-sidebar">
        <NuxtLink to="/admin/dashboard" class="sidebar-link">Товары</NuxtLink>
        <span class="sidebar-link active">Редактирование</span>
      </div>

      <div class="admin-content">
        <div v-if="loading" class="loading">Загрузка...</div>

        <div v-else>
          <!-- Заголовок -->
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
            <h1 style="margin: 0;">{{ form.name || 'Новый товар' }}</h1>
            <button @click="copyId" class="btn-copy" title="Копировать ID">📋</button>
          </div>

          <p v-if="cloudProduct" style="color: #666; margin-bottom: 24px;">
            Цена: {{ cloudProduct.price?.toLocaleString() }} сум | 
            В наличии: {{ cloudProduct.stock }} шт. |
            Артикул: {{ cloudProduct.code }}
          </p>

          <!-- Импорт с hobbygames.ru -->
          <div class="form-group import-block">
            <label style="color: #27ae60;">🔗 Импорт с hobbygames.ru</label>
            <div style="display: flex; gap: 8px;">
              <input v-model="importUrl" type="text" placeholder="https://hobbygames.ru/catan" style="flex: 1;" />
              <button @click="importFromHobbygames" :disabled="importing" class="btn-import">
                {{ importing ? 'Загрузка...' : 'Загрузить' }}
              </button>
            </div>
            <p style="font-size: 0.8rem; color: #666; margin-top: 4px;">
              Вставьте ссылку на товар — фото и описание загрузятся автоматически
            </p>
          </div>

          <!-- Название -->
          <div class="form-group">
            <label>Название товара</label>
            <input v-model="form.name" type="text" />
          </div>

          <!-- Категория -->
          <div class="form-group">
            <label>Категория</label>
            <select v-model="form.category" class="category-select-full">
              <option value="">— Выберите категорию —</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
            </select>
          </div>

          <!-- Статус -->
          <div class="form-group">
            <label>
              <input v-model="form.published" type="checkbox" :true-value="1" :false-value="0" />
              Опубликован
            </label>
          </div>

          <!-- Размер картинки -->
          <div class="form-group">
            <label>Размер картинки: {{ form.image_size }}px</label>
            <div style="display: flex; align-items: center; gap: 16px;">
              <input 
                v-model.number="form.image_size" 
                type="range" 
                min="200" 
                max="600" 
                step="50"
                style="flex: 1;"
              />
              <span style="min-width: 60px; text-align: center; font-weight: 600;">{{ form.image_size }}px</span>
            </div>
            <p style="font-size: 0.8rem; color: #666; margin-top: 4px;">
              Регулирует размер основной фотографии на странице товара
            </p>
          </div>

          <!-- Фотографии -->
          <div class="form-group">
            <label>Фотографии ({{ form.images.length }})</label>
            <div class="images-grid">
              <div v-for="(img, i) in form.images" :key="i" class="image-thumb">
                <img :src="img" />
                <button @click="removeImage(i)" class="image-remove">×</button>
              </div>
              <div class="image-add">
                <label class="image-add__btn">
                  <input type="file" accept="image/*" multiple @change="uploadImage" style="display: none;" />
                  <span v-if="uploading">Загрузка...</span>
                  <span v-else>+ Файл</span>
                </label>
                <button @click="addImageUrl" class="image-add__url">+ URL</button>
              </div>
            </div>
          </div>

          <!-- Описание -->
          <div class="form-group">
            <label>Описание</label>
            <div class="editor">
              <div class="editor-toolbar">
                <button @click="document.execCommand('bold')" title="Жирный"><b>B</b></button>
                <button @click="document.execCommand('italic')" title="Курсив"><i>I</i></button>
                <button @click="document.execCommand('underline')" title="Подчёркнутый"><u>U</u></button>
                <button @click="document.execCommand('insertUnorderedList')" title="Список">•</button>
                <button @click="document.execCommand('insertOrderedList')" title="Нумерованный">1.</button>
                <button @click="insertEditorImage" title="Картинка">🖼️</button>
              </div>
              <div
                ref="editorRef"
                class="editor-content"
                contenteditable="true"
                v-html="form.description"
                @input="onEditorInput"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style>
.status-msg {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-msg.success {
  background: #d4edda;
  color: #155724;
}

.status-msg.error {
  background: #f8d7da;
  color: #721c24;
}

.btn-copy {
  background: none;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 0.9rem;
}

.btn-copy:hover {
  background: #f5f5f5;
}

.import-block {
  background: #f0fff0;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #27ae60;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 8px;
  color: #333;
}

.form-group input[type="text"] {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
}

.form-group input[type="text"]:focus {
  outline: none;
  border-color: #fcc15f;
}

.category-select-full {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
  background: #fff;
  cursor: pointer;
}

.category-select-full:focus {
  outline: none;
  border-color: #fcc15f;
}

.btn-import {
  padding: 12px 20px;
  background: #27ae60;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
}

.btn-import:hover:not(:disabled) {
  background: #219a52;
}

.btn-import:disabled {
  opacity: 0.6;
}

.images-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-thumb {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 2px solid #e0e0e0;
}

.image-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  background: rgba(231, 76, 60, 0.9);
  color: #fff;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-add {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.image-add__btn {
  width: 120px;
  height: 56px;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.85rem;
  color: #666;
}

.image-add__btn:hover {
  border-color: #fcc15f;
  color: #fcc15f;
}

.image-add__url {
  width: 120px;
  height: 56px;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  background: none;
  cursor: pointer;
  font-size: 0.85rem;
  color: #666;
}

.image-add__url:hover {
  border-color: #fcc15f;
  color: #fcc15f;
}

.editor {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.editor-toolbar {
  background: #f5f5f5;
  padding: 8px;
  display: flex;
  gap: 4px;
  border-bottom: 1px solid #e0e0e0;
}

.editor-toolbar button {
  width: 36px;
  height: 36px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.editor-toolbar button:hover {
  background: #fcc15f20;
  border-color: #fcc15f;
}

.editor-content {
  min-height: 300px;
  padding: 16px;
  font-size: 1rem;
  line-height: 1.6;
}

.editor-content:focus {
  outline: none;
}

.editor-content img {
  max-width: 100%;
  border-radius: 8px;
  margin: 10px 0;
}

.btn-save {
  padding: 10px 24px;
  background: #27ae60;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-save:hover:not(:disabled) {
  background: #219a52;
}

.btn-save:disabled {
  opacity: 0.6;
}
</style>
