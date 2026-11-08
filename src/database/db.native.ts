import { SEED_CATEGORIES, SEED_PRODUCTS } from './seedData';
import { Product, Category, User, Order, Address, OrderStatus, SupportTicket } from '../types';
import { requireOptionalNativeModule } from 'expo-modules-core';

let SQLite: any = null;
let dbInstance: any = null;
let useFallback = false;

interface InMemoryStore {
  users: (User & { password?: string })[];
  categories: Category[];
  products: Product[];
  orders: Order[];
  addresses: Address[];
  supportTickets: SupportTicket[];
}

const memoryStore: InMemoryStore = {
  users: [
    {
      id: 'usr_demo',
      email: 'alex@example.com',
      name: 'Alex Johnson',
      phone: '+234 803 123 4567',
      password: 'password123',
      createdAt: new Date().toISOString(),
    }
  ],
  categories: [...SEED_CATEGORIES],
  products: [...SEED_PRODUCTS],
  orders: [
    {
      id: 'ord_1001',
      userId: 'usr_demo',
      items: [
        {
          id: 'item_1',
          orderId: 'ord_1001',
          productId: 'prod_1',
          productTitle: 'Sony WH-1000XM5 Wireless Headphones',
          productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
          quantity: 1,
          unitPrice: 450000,
        }
      ],
      subtotal: 450000,
      shippingFee: 0,
      discount: 20000,
      total: 430000,
      status: 'delivered',
      paymentMethod: 'card',
      shippingAddress: {
        id: 'addr_1',
        fullName: 'Alex Johnson',
        street: '14 Admiralty Way, Lekki Phase 1',
        city: 'Lekki',
        state: 'Lagos State',
        postalCode: '106104',
        country: 'Nigeria',
        phone: '+234 803 123 4567',
        isDefault: true,
      },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      trackingNumber: 'TRK-983411-NG',
    }
  ],
  addresses: [
    {
      id: 'addr_1',
      userId: 'usr_demo',
      fullName: 'Alex Johnson',
      street: '14 Admiralty Way, Lekki Phase 1',
      city: 'Lekki',
      state: 'Lagos State',
      postalCode: '106104',
      country: 'Nigeria',
      phone: '+234 803 123 4567',
      isDefault: true,
    }
  ],
  supportTickets: [
    {
      id: 'TIC-1092-NG',
      userId: 'usr_demo',
      category: 'Orders & Delivery',
      orderId: 'ord_1001',
      message: 'Package arrived safely at Lekki! Inquiring about warranty on the Sony Headphones.',
      mediaUri: undefined,
      status: 'resolved',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ],
};

export async function initDatabase(): Promise<void> {
  // Resilient memory store with pre-seeded products, locations, user, and categories
  useFallback = true;
  return;
}

function seedSQLiteDatabase(db: any): void {
  try {
    db.runSync(
      'INSERT OR IGNORE INTO users (id, email, name, phone, password, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['usr_demo', 'alex@example.com', 'Alex Johnson', '+234 803 123 4567', 'password123', new Date().toISOString()]
    );

    db.runSync(
      'INSERT OR IGNORE INTO addresses (id, user_id, full_name, street, city, state, postal_code, country, phone, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['addr_1', 'usr_demo', 'Alex Johnson', '742 Evergreen Terrace', 'Springfield', 'OR', '97477', 'United States', '+1 (555) 234-5678', 1]
    );

    for (const cat of SEED_CATEGORIES) {
      db.runSync(
        'INSERT OR IGNORE INTO categories (id, name, slug, icon, item_count) VALUES (?, ?, ?, ?, ?)',
        [cat.id, cat.name, cat.slug, cat.icon, cat.itemCount || 0]
      );
    }

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
  } catch (e) {
    console.warn('Seeding SQLite error:', e);
  }
}

export async function getProducts(options?: {
  categoryId?: string;
  query?: string;
  featuredOnly?: boolean;
  sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'popular';
}): Promise<Product[]> {
  const { categoryId, query, featuredOnly, sortBy } = options || {};

  if (useFallback || !dbInstance) {
    let result = [...memoryStore.products];
    if (categoryId && categoryId !== 'cat_all') {
      result = result.filter(p => p.categoryId === categoryId);
    }
    if (query && query.trim().length > 0) {
      const q = query.toLowerCase();
      result = result.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    if (featuredOnly) {
      result = result.filter(p => p.isFeatured);
    }
    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'popular') result.sort((a, b) => b.reviewsCount - a.reviewsCount);
    else result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    return result;
  }

  try {
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

    const rows = dbInstance.getAllSync(sql, params);
    return rows.map(mapRowToProduct);
  } catch {
    return [...memoryStore.products];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  if (useFallback || !dbInstance) {
    return memoryStore.products.find(p => p.id === id) || null;
  }

  try {
    const row = dbInstance.getFirstSync('SELECT * FROM products WHERE id = ?', [id]);
    if (!row) return null;
    return mapRowToProduct(row);
  } catch {
    return memoryStore.products.find(p => p.id === id) || null;
  }
}

export async function getCategories(): Promise<Category[]> {
  if (useFallback || !dbInstance) {
    return [...memoryStore.categories];
  }

  try {
    const rows = dbInstance.getAllSync('SELECT * FROM categories ORDER BY id');
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      icon: r.icon,
      itemCount: r.item_count,
    }));
  } catch {
    return [...memoryStore.categories];
  }
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

  let location = undefined;
  if (r.location_json) {
    try {
      location = JSON.parse(r.location_json);
    } catch {
      // fallback
    }
  }
  if (!location) {
    location = SEED_PRODUCTS.find(p => p.id === r.id)?.location;
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
    location,
  };
}

export async function getUserByEmail(email: string): Promise<(User & { password?: string }) | null> {
  const normalized = email.trim().toLowerCase();
  if (useFallback || !dbInstance) {
    return memoryStore.users.find(u => u.email.toLowerCase() === normalized) || null;
  }

  try {
    const row = dbInstance.getFirstSync('SELECT * FROM users WHERE LOWER(email) = ?', [normalized]);
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      phone: row.phone,
      password: row.password,
      createdAt: row.created_at,
    };
  } catch {
    return memoryStore.users.find(u => u.email.toLowerCase() === normalized) || null;
  }
}

export async function createUser(data: {
  email: string;
  name: string;
  password: string;
  phone?: string;
}): Promise<User> {
  const newUser: User & { password?: string } = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: data.email.trim().toLowerCase(),
    name: data.name.trim(),
    phone: data.phone || '',
    password: data.password,
    createdAt: new Date().toISOString(),
  };

  if (useFallback || !dbInstance) {
    memoryStore.users.push(newUser);
    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      phone: newUser.phone,
      createdAt: newUser.createdAt,
    };
  }

  try {
    dbInstance.runSync(
      'INSERT INTO users (id, email, name, phone, password, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [newUser.id, newUser.email, newUser.name, newUser.phone || '', data.password, newUser.createdAt]
    );
  } catch {
    memoryStore.users.push(newUser);
  }

  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    phone: newUser.phone,
    createdAt: newUser.createdAt,
  };
}

export async function updateUserPassword(
  userId: string,
  oldPass: string,
  newPass: string
): Promise<{ success: boolean; error?: string }> {
  if (useFallback || !dbInstance) {
    const user = memoryStore.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User account not found.' };
    if (user.password && user.password !== oldPass) {
      return { success: false, error: 'Current password does not match.' };
    }
    user.password = newPass;
    return { success: true };
  }

  try {
    const row = dbInstance.getFirstSync('SELECT password FROM users WHERE id = ?', [userId]);
    if (!row) return { success: false, error: 'User account not found.' };
    if (row.password !== oldPass) {
      return { success: false, error: 'Current password does not match.' };
    }
    dbInstance.runSync('UPDATE users SET password = ? WHERE id = ?', [newPass, userId]);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Could not update password.' };
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  if (useFallback || !dbInstance) {
    memoryStore.users = memoryStore.users.filter(u => u.id !== userId);
    memoryStore.addresses = memoryStore.addresses.filter(a => a.userId !== userId);
    memoryStore.orders = memoryStore.orders.filter(o => o.userId !== userId);
    return { success: true };
  }

  try {
    dbInstance.runSync('DELETE FROM addresses WHERE user_id = ?', [userId]);
    dbInstance.runSync('DELETE FROM orders WHERE user_id = ?', [userId]);
    dbInstance.runSync('DELETE FROM users WHERE id = ?', [userId]);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Could not delete user account.' };
  }
}

export async function getOrders(userId: string): Promise<Order[]> {
  if (useFallback || !dbInstance) {
    return memoryStore.orders
      .filter(o => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  try {
    const orders = dbInstance.getAllSync(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    return orders.map((ord: any) => {
      const items = dbInstance.getAllSync(
        'SELECT * FROM order_items WHERE order_id = ?',
        [ord.id]
      ).map((item: any) => ({
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
  } catch {
    return memoryStore.orders
      .filter(o => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function createOrder(order: Order): Promise<Order> {
  if (useFallback || !dbInstance) {
    memoryStore.orders.unshift(order);
    return order;
  }

  try {
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
        JSON.stringify(order.shippingAddress || null),
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
  } catch {
    memoryStore.orders.unshift(order);
  }

  return order;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
  if (useFallback || !dbInstance) {
    const o = memoryStore.orders.find(ord => ord.id === orderId);
    if (o) o.status = status;
    return true;
  }

  try {
    dbInstance.runSync('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
    const memOrder = memoryStore.orders.find(ord => ord.id === orderId);
    if (memOrder) memOrder.status = status;
    return true;
  } catch (err) {
    console.error('Failed to update order status:', err);
    return false;
  }
}

export async function getAddresses(userId: string): Promise<Address[]> {
  if (useFallback || !dbInstance) {
    return memoryStore.addresses.filter(a => a.userId === userId || !a.userId);
  }

  try {
    const rows = dbInstance.getAllSync(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC',
      [userId]
    );

    return rows.map((r: any) => ({
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
  } catch {
    return memoryStore.addresses.filter(a => a.userId === userId || !a.userId);
  }
}

export async function saveAddress(address: Address): Promise<Address> {
  if (address.isDefault) {
    memoryStore.addresses.forEach(a => (a.isDefault = false));
  }
  const idx = memoryStore.addresses.findIndex(a => a.id === address.id);
  if (idx >= 0) {
    memoryStore.addresses[idx] = address;
  } else {
    memoryStore.addresses.push(address);
  }

  if (!useFallback && dbInstance) {
    try {
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
    } catch {
      // Handled via memoryStore
    }
  }

  return address;
}

export async function createSupportTicket(
  ticket: Omit<SupportTicket, 'id' | 'createdAt'>
): Promise<SupportTicket> {
  const newTicket: SupportTicket = {
    ...ticket,
    id: `TIC-${Math.floor(100000 + Math.random() * 900000)}-NG`,
    createdAt: new Date().toISOString(),
  };

  memoryStore.supportTickets.unshift(newTicket);
  return newTicket;
}

export async function getSupportTickets(userId?: string): Promise<SupportTicket[]> {
  if (!userId) return [...memoryStore.supportTickets];
  return memoryStore.supportTickets.filter(t => t.userId === userId);
}
