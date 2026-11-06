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

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: 'card' | 'apple_pay' | 'google_pay' | 'cod';
  shippingAddress: Address;
  createdAt: string;
  trackingNumber?: string;
}

export interface PromoCode {
  code: string;
  discountPercentage: number;
  maxDiscount?: number;
  minOrder?: number;
}

