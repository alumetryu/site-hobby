export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Hobby Games Tashkent — Магазин настольных игр',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Магазин настольных игр Hobby Games в Ташкенте. Каталог настольных игр, варгеймов, ККИ и аксессуаров.' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Ubuntu:wght@400;500;700&display=swap' }
      ]
    }
  }
})
