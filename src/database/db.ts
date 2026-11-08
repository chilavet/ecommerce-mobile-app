import { SEED_CATEGORIES, SEED_PRODUCTS } from './seedData';
import { Product, Category, User, Order, Address, OrderStatus, SupportTicket } from '../types';

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
  // Ready immediately in-memory
  return Promise.resolve();
}

export async function getProducts(options?: {
  categoryId?: string;
  query?: string;
  featuredOnly?: boolean;
  sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'popular';
}): Promise<Product[]> {
  const { categoryId, query, featuredOnly, sortBy } = options || {};

  for (const prod of SEED_PRODUCTS) {
    if (!memoryStore.products.some(p => p.id === prod.id)) {
      memoryStore.products.push(prod);
    }
  }

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

export async function getProductById(id: string): Promise<Product | null> {
  const seedProd = SEED_PRODUCTS.find(p => p.id === id);
  if (seedProd && !memoryStore.products.some(p => p.id === id)) {
    memoryStore.products.push(seedProd);
  }
  return memoryStore.products.find(p => p.id === id) || null;
}

export async function getCategories(): Promise<Category[]> {
  for (const cat of SEED_CATEGORIES) {
    if (!memoryStore.categories.some(c => c.id === cat.id)) {
      memoryStore.categories.push(cat);
    }
  }
  return SEED_CATEGORIES.map(seedCat => {
    const existing = memoryStore.categories.find(c => c.id === seedCat.id);
    return existing || seedCat;
  });
}

export async function getUserByEmail(email: string): Promise<(User & { password?: string }) | null> {
  const normalized = email.trim().toLowerCase();
  return memoryStore.users.find(u => u.email.toLowerCase() === normalized) || null;
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

  memoryStore.users.push(newUser);
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
  const user = memoryStore.users.find(u => u.id === userId);
  if (!user) return { success: false, error: 'User account not found.' };
  if (user.password && user.password !== oldPass) {
    return { success: false, error: 'Current password does not match.' };
  }
  user.password = newPass;
  return { success: true };
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  memoryStore.users = memoryStore.users.filter(u => u.id !== userId);
  memoryStore.addresses = memoryStore.addresses.filter(a => a.userId !== userId);
  memoryStore.orders = memoryStore.orders.filter(o => o.userId !== userId);
  return { success: true };
}

export async function getOrders(userId: string): Promise<Order[]> {
  return memoryStore.orders
    .filter(o => o.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createOrder(order: Order): Promise<Order> {
  memoryStore.orders.unshift(order);
  return order;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
  const o = memoryStore.orders.find(ord => ord.id === orderId);
  if (o) o.status = status;
  return true;
}

export async function getAddresses(userId: string): Promise<Address[]> {
  return memoryStore.addresses.filter(a => a.userId === userId || !a.userId);
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
