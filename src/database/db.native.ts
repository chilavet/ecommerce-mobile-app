import * as SQLite from 'expo-sqlite';
import { SEED_CATEGORIES, SEED_PRODUCTS } from './seedData';
import { Product, Category, User, Order, Address } from '../types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<void> {
  try {
    dbInstance = SQLite.openDatabaseSync('shop_pulse.db');
    
    dbInstance.execSync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        password TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        icon TEXT NOT NULL,
        item_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        category_id TEXT NOT NULL,
        price REAL NOT NULL,
        original_price REAL,
        rating REAL NOT NULL,
        reviews_count INTEGER NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT NOT NULL,
        images_json TEXT,
        stock INTEGER NOT NULL,
        brand TEXT NOT NULL,
        is_featured INTEGER DEFAULT 0,
        is_trending INTEGER DEFAULT 0,
        specs_json TEXT
      );

      CREATE TABLE IF NOT EXISTS addresses (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        full_name TEXT NOT NULL,
        street TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        country TEXT NOT NULL,
        phone TEXT NOT NULL,
        is_default INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        subtotal REAL NOT NULL,
        shipping_fee REAL NOT NULL,
        discount REAL NOT NULL,
        total REAL NOT NULL,
        status TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        shipping_address_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        tracking_number TEXT
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        product_title TEXT NOT NULL,
        product_image TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `);

    const rowCount = dbInstance.getFirstSync<{ count: number }>('SELECT count(*) as count FROM products');
    if (!rowCount || rowCount.count === 0) {
      seedSQLiteDatabase(dbInstance);
    }
  } catch (error) {
    console.warn('Native SQLite init encountered an issue:', error);
  }
}

function seedSQLiteDatabase(db: SQLite.SQLiteDatabase): void {
  // Demo user
  db.runSync(
    'INSERT OR IGNORE INTO users (id, email, name, phone, password, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ['usr_demo', 'alex@example.com', 'Alex Johnson', '+1 (555) 234-5678', 'password123', new Date().toISOString()]
  );

  // Default address
  db.runSync(
    'INSERT OR IGNORE INTO addresses (id, user_id, full_name, street, city, state, postal_code, country, phone, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ['addr_1', 'usr_demo', 'Alex Johnson', '742 Evergreen Terrace', 'Springfield', 'OR', '97477', 'United States', '+1 (555) 234-5678', 1]
  );

  // Categories
  for (const cat of SEED_CATEGORIES) {
    db.runSync(
      'INSERT OR IGNORE INTO categories (id, name, slug, icon, item_count) VALUES (?, ?, ?, ?, ?)',
      [cat.id, cat.name, cat.slug, cat.icon, cat.itemCount || 0]
    );
  }

  // Products
  for (const prod of SEED_PRODUCTS) {
    db.runSync(
      `INSERT OR IGNORE INTO products (
        id, title, category, category_id, price, original_price,
        rating, reviews_count, description, image_url, images_json,
        stock, brand, is_featured, is_trending, specs_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        prod.id,
        prod.title,
        prod.category,
        prod.categoryId,
        prod.price,
        prod.originalPrice || null,
        prod.rating,
        prod.reviewsCount,
        prod.description,
        prod.imageUrl,
        JSON.stringify(prod.images || [prod.imageUrl]),
        prod.stock,
        prod.brand,
        prod.isFeatured ? 1 : 0,
        prod.isTrending ? 1 : 0,
        JSON.stringify(prod.specs || {}),
      ]
    );
  }

  // Demo initial order
  db.runSync(
    `INSERT OR IGNORE INTO orders (
      id, user_id, subtotal, shipping_fee, discount, total, status,
      payment_method, shipping_address_json, created_at, tracking_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'ord_1001',
      'usr_demo',
      349.99,
      0,
      20,
      329.99,
      'delivered',
      'card',
      JSON.stringify({
        id: 'addr_1',
        fullName: 'Alex Johnson',
        street: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'OR',
        postalCode: '97477',
        country: 'United States',
        phone: '+1 (555) 234-5678',
        isDefault: true,
      }),
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      'TRK-98341129-US',
    ]
  );

  db.runSync(
    `INSERT OR IGNORE INTO order_items (
      id, order_id, product_id, quantity, unit_price, product_title, product_image
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'item_1',
      'ord_1001',
      'prod_1',
      1,
      349.99,
      'Sony WH-1000XM5 Wireless Headphones',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    ]
  );
}

export async function getProducts(options?: {
  categoryId?: string;
  query?: string;
  featuredOnly?: boolean;
  sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'popular';
}): Promise<Product[]> {
  const { categoryId, query, featuredOnly, sortBy } = options || {};

  if (!dbInstance) {
    return [...SEED_PRODUCTS];
  }

  let sql = 'SELECT * FROM products WHERE 1=1';
  const params: any[] = [];

  if (categoryId && categoryId !== 'cat_all') {
    sql += ' AND category_id = ?';
    params.push(categoryId);
  }
  if (query && query.trim().length > 0) {
    sql += ' AND (title LIKE ? OR brand LIKE ? OR description LIKE ?)';
    const searchParam = `%${query}%`;
    params.push(searchParam, searchParam, searchParam);
  }
  if (featuredOnly) {
    sql += ' AND is_featured = 1';
  }

  if (sortBy === 'price-asc') sql += ' ORDER BY price ASC';
  else if (sortBy === 'price-desc') sql += ' ORDER BY price DESC';
  else if (sortBy === 'rating') sql += ' ORDER BY rating DESC';
  else if (sortBy === 'popular') sql += ' ORDER BY reviews_count DESC';
  else sql += ' ORDER BY is_featured DESC, rating DESC';

  const rows = dbInstance.getAllSync<any>(sql, params);
  return rows.map(mapRowToProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!dbInstance) {
    return SEED_PRODUCTS.find(p => p.id === id) || null;
  }

  const row = dbInstance.getFirstSync<any>('SELECT * FROM products WHERE id = ?', [id]);
  if (!row) return null;
  return mapRowToProduct(row);
}

export async function getCategories(): Promise<Category[]> {
  if (!dbInstance) {
    return [...SEED_CATEGORIES];
  }

  const rows = dbInstance.getAllSync<any>('SELECT * FROM categories ORDER BY id');
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    icon: r.icon,
    itemCount: r.item_count,
  }));
}

function mapRowToProduct(r: any): Product {
  let images: string[] = [];
  try {
    images = r.images_json ? JSON.parse(r.images_json) : [r.image_url];
  } catch {
    images = [r.image_url];
  }

  let specs: Record<string, string> = {};
  try {
    specs = r.specs_json ? JSON.parse(r.specs_json) : {};
  } catch {
    specs = {};
  }

  return {
    id: r.id,
    title: r.title,
    category: r.category,
    categoryId: r.category_id,
    price: Number(r.price),
    originalPrice: r.original_price ? Number(r.original_price) : undefined,
    rating: Number(r.rating),
    reviewsCount: Number(r.reviews_count),
    description: r.description,
    imageUrl: r.image_url,
    images,
    stock: Number(r.stock),
    brand: r.brand,
    isFeatured: Boolean(r.is_featured),
    isTrending: Boolean(r.is_trending),
    specs,
  };
}

export async function getUserByEmail(email: string): Promise<(User & { password?: string }) | null> {
  const normalized = email.trim().toLowerCase();
  if (!dbInstance) return null;

  const row = dbInstance.getFirstSync<any>('SELECT * FROM users WHERE LOWER(email) = ?', [normalized]);
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    password: row.password,
    createdAt: row.created_at,
  };
}

export async function createUser(data: {
  email: string;
  name: string;
  password: string;
  phone?: string;
}): Promise<User> {
  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: data.email.trim().toLowerCase(),
    name: data.name.trim(),
    phone: data.phone || '',
    createdAt: new Date().toISOString(),
  };

  if (dbInstance) {
    dbInstance.runSync(
      'INSERT INTO users (id, email, name, phone, password, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [newUser.id, newUser.email, newUser.name, newUser.phone || '', data.password, newUser.createdAt]
    );
  }

  return newUser;
}

export async function getOrders(userId: string): Promise<Order[]> {
  if (!dbInstance) return [];

  const orders = dbInstance.getAllSync<any>(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );

  return orders.map(ord => {
    const items = dbInstance!.getAllSync<any>(
      'SELECT * FROM order_items WHERE order_id = ?',
      [ord.id]
    ).map(item => ({
      id: item.id,
      orderId: item.order_id,
      productId: item.product_id,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      productTitle: item.product_title,
      productImage: item.product_image,
    }));

    let shippingAddress: Address;
    try {
      shippingAddress = JSON.parse(ord.shipping_address_json);
    } catch {
      shippingAddress = {
        id: 'addr_fallback',
        fullName: 'Customer',
        street: 'Shipping Address',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        phone: '',
        isDefault: true,
      };
    }

    return {
      id: ord.id,
      userId: ord.user_id,
      subtotal: ord.subtotal,
      shippingFee: ord.shipping_fee,
      discount: ord.discount,
      total: ord.total,
      status: ord.status,
      paymentMethod: ord.payment_method,
      shippingAddress,
      createdAt: ord.created_at,
      trackingNumber: ord.tracking_number,
      items,
    };
  });
}

export async function createOrder(order: Order): Promise<Order> {
  if (!dbInstance) return order;

  dbInstance.runSync(
    `INSERT INTO orders (
      id, user_id, subtotal, shipping_fee, discount, total, status,
      payment_method, shipping_address_json, created_at, tracking_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      order.id,
      order.userId,
      order.subtotal,
      order.shippingFee,
      order.discount,
      order.total,
      order.status,
      order.paymentMethod,
      JSON.stringify(order.shippingAddress),
      order.createdAt,
      order.trackingNumber || '',
    ]
  );

  for (const item of order.items) {
    dbInstance.runSync(
      `INSERT INTO order_items (
        id, order_id, product_id, quantity, unit_price, product_title, product_image
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.orderId,
        item.productId,
        item.quantity,
        item.unitPrice,
        item.productTitle,
        item.productImage,
      ]
    );
  }

  return order;
}

export async function getAddresses(userId: string): Promise<Address[]> {
  if (!dbInstance) return [];

  const rows = dbInstance.getAllSync<any>(
    'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC',
    [userId]
  );

  return rows.map(r => ({
    id: r.id,
    userId: r.user_id,
    fullName: r.full_name,
    street: r.street,
    city: r.city,
    state: r.state,
    postalCode: r.postal_code,
    country: r.country,
    phone: r.phone,
    isDefault: Boolean(r.is_default),
  }));
}

export async function saveAddress(address: Address): Promise<Address> {
  if (!dbInstance) return address;

  if (address.isDefault && address.userId) {
    dbInstance.runSync('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [address.userId]);
  }

  dbInstance.runSync(
    `INSERT OR REPLACE INTO addresses (
      id, user_id, full_name, street, city, state, postal_code, country, phone, is_default
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      address.id,
      address.userId || null,
      address.fullName,
      address.street,
      address.city,
      address.state,
      address.postalCode,
      address.country,
      address.phone,
      address.isDefault ? 1 : 0,
    ]
  );

  return address;
}
