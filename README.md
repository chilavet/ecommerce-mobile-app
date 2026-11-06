# ShopPulse 🛍️ — React Native & Expo E-Commerce App

A high-performance cross-platform mobile e-commerce application built with **React Native**, **Expo (SDK 58)**, **Expo Router**, and **Local SQLite**.

---

## 📱 Features

- **🛍️ Product Discovery & Catalog**:
  - Category filtering (Electronics, Fashion, Home & Living, Audio & Gear).
  - Live debounced search across brands, titles, categories, and tags.
  - Sorting by Popularity, Top Rated, Price: Low to High, and Price: High to Low.
  - Promotional hero discounts with coupon code integration.

- **🔍 Product Detail View**:
  - Image gallery with interactive thumbnail selector.
  - Rating breakdown, verified review count, and real-time stock indicator.
  - Comprehensive technical specifications table.
  - Interactive quantity stepper, "Add to Cart", and instant "Buy Now" flow.

- **🛒 Shopping Cart & Checkout**:
  - Quantity adjustments with stock bounds checking.
  - Promo code discounts (e.g. `SAVE20`, `WELCOME10`, `FREESHIP`).
  - Automatic Free Shipping threshold calculation ($100+).
  - Full checkout flow: Saved delivery addresses or add new address on the fly.
  - Payment method selection: Encrypted Credit/Debit Card, Apple/Google Pay, Cash on Delivery.
  - Order success screen with order reference and tracking ID.

- **📦 SQLite Order History & User Profile**:
  - Local SQLite persistence for users, orders, and addresses via `expo-sqlite` (and automatic in-memory fallback for web preview).
  - Real-time order tracking status (`placed`, `processing`, `shipped`, `delivered`).
  - User authentication with Demo auto-fill credentials, registration, and session management.

---

## 🚀 Getting Started

### 1. Navigate to Project
```bash
cd ecommerce-mobile-app
```

### 2. Start the App
Run Expo's Metro bundler:
```bash
npm start
```

From the interactive terminal prompt, you can press:
- `i` to open in the **iOS Simulator** (requires Xcode on macOS)
- `a` to open in the **Android Emulator** (requires Android Studio)
- `w` to open in your **Web Browser**
- Scan the displayed QR code with the **Expo Go** app on your iPhone or Android device.

---

## 🧪 Demo Credentials

- **Email**: `alex@example.com`
- **Password**: `password123`
*(Or tap the "Auto-fill Demo Credentials" button directly on the Account screen)*

---

## 📂 Project Architecture

```
ecommerce-mobile-app/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx           # 5-tab bar with real-time cart badge
│   │   ├── index.tsx             # Home feed (Hero, Categories, Featured deals)
│   │   ├── explore.tsx           # Search, multi-category & sorting catalog
│   │   ├── cart.tsx              # Cart items, promo code, subtotal calculations
│   │   ├── orders.tsx            # Order history & delivery tracking
│   │   └── profile.tsx           # User auth modal, addresses & settings
│   ├── product/
│   │   └── [id].tsx              # Detailed product view & specs
│   ├── checkout/
│   │   ├── index.tsx             # Shipping & payment checkout flow
│   │   └── success.tsx           # Order confirmation receipt
│   └── _layout.tsx               # Root stack navigation & Context providers
├── src/
│   ├── database/
│   │   ├── db.native.ts          # Native SQLite schema & CRUD (expo-sqlite)
│   │   ├── db.ts                 # Web & fallback reactive memory store
│   │   └── seedData.ts           # Pre-seeded products, categories, coupons
│   ├── context/
│   │   ├── AuthContext.tsx       # Auth session & credentials state
│   │   └── CartContext.tsx       # Shopping cart operations & calculations
│   ├── components/               # ProductCard, CategoryPill, SearchBar, CartItemRow, OrderCard
│   ├── constants/                # Theme colors, shadows, typography
│   └── types/                    # TypeScript interfaces for all data models
├── metro.config.js               # Metro bundler config
└── app.json                      # Expo application metadata
```
