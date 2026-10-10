# Hobby Games Tashkent

Board game store website built with **Nuxt 3**. A full-stack catalog for a real retail store in Tashkent selling tabletop games, wargames, TCGs and accessories.

## Features

- Responsive homepage with banners, featured products, and new arrivals
- Product catalog with search, category filtering, and in-stock filter
- Product cards with images, prices, and availability status
- Admin panel with authentication for managing products and categories
- Import and publish products from external sources (CloudShop POS)
- Mark products as popular or new for homepage display

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3, TypeScript, Google Fonts (Roboto, Ubuntu) |
| Backend | Nuxt 3, Nitro |
| Database | SQLite (sql.js) |
| Scraping | JSDOM, Multer (file uploads) |
| External | CloudShop API integration |

## Getting Started

```bash
# Install dependencies
npm install

# Development server at http://localhost:3000
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create a `.env` file in the root directory:

```
CS_EMAIL=your_cloudshop_email
CS_PASSWORD=your_cloudshop_password
CS_URL=https://web.cloudshop.ru/pos/home
CS_COMPANY_ID=your_company_id
CS_STORE_ID=your_store_id
ADMIN_LOGIN=your_admin_login
ADMIN_PASSWORD=your_admin_password
```

## Project Structure

```
├── pages/           # Vue pages (index, catalog, game detail, admin)
├── components/      # Reusable Vue components (ProductCard)
├── server/          # Nitro backend
│   ├── api/         # REST API endpoints
│   └── utils/       # CloudShop client, DB utils, scraper
├── assets/          # CSS styles
├── data/            # SQLite database
└── public/          # Static files
```
