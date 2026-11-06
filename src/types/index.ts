export interface StoreLocation {
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  phone?: string;
}

export interface UserLocation {
  id?: string;
  name: string;
  city: string;
  state: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  isCurrent?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  itemCount?: number;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  description: string;
  imageUrl: string;
  images?: string[];
  stock: number;
  brand: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  tags?: string[];
  specs?: Record<string, string>;
  location?: StoreLocation;
  distanceMiles?: number;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  addresses?: Address[];
  createdAt: string;
}

export interface Address {
  id: string;
  userId?: string;
  fullName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export type OrderStatus = 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productTitle: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
}

export type PaymentMethod = 'card' | 'apple_pay' | 'google_pay' | 'cod' | 'wallet' | 'paystack';

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  shippingAddress?: Address;
  createdAt: string;
  trackingNumber?: string;
}

export type WalletTransactionType = 'credit' | 'debit';
export type WalletTransactionChannel = 'paystack' | 'checkout' | 'refund' | 'bonus' | 'transfer';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletTransactionType; // 'credit' | 'debit'
  amount: number;
  description: string;
  channel: WalletTransactionChannel;
  reference: string;
  createdAt: string;
  status: 'successful' | 'pending' | 'failed';
}

export interface Wallet {
  userId: string;
  balance: number;
  currency: string;
  transactions: WalletTransaction[];
}

export interface PromoCode {
  code: string;
  discountPercentage: number;
  maxDiscount?: number;
  minOrder?: number;
}

