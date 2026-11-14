'use client';

import {
  Product,
  SiteSettings,
  Order,
  Review,
  defaultProducts,
  defaultSettings,
  defaultReviews,
} from '../data/products';

const PRODUCTS_KEY = 'halol_gosht_products';
const SETTINGS_KEY = 'halol_gosht_settings';
const ORDERS_KEY = 'halol_gosht_orders';
const REVIEWS_KEY = 'halol_gosht_reviews';

// ─── Products ────────────────────────────────────────────────
export function getProducts(): Product[] {
  if (typeof window === 'undefined') return defaultProducts;
  try {
    const stored = localStorage.getItem(PRODUCTS_KEY);
    return stored ? JSON.parse(stored) : defaultProducts;
  } catch {
    return defaultProducts;
  }
}

export function saveProducts(products: Product[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

// ─── Settings ────────────────────────────────────────────────
export function getSettings(): SiteSettings {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return defaultSettings;
    const parsed = JSON.parse(stored);
    if (parsed.telegram === 'https://t.me/halolgosht' || !parsed.telegram) {
      parsed.telegram = 'https://t.me/Otabek07092000';
    }
    if (!parsed.telegramBotToken) {
      parsed.telegramBotToken = defaultSettings.telegramBotToken;
    }
    if (!parsed.telegramChatId) {
      parsed.telegramChatId = defaultSettings.telegramChatId;
    }
    if (!parsed.telegramBotUsername) {
      parsed.telegramBotUsername = defaultSettings.telegramBotUsername;
    }
    // zones maydonini oldingisi bo'lmasa default qo'yib qo'yamiz
    if (!parsed.deliverySettings?.zones) {
      parsed.deliverySettings = {
        ...defaultSettings.deliverySettings,
        ...parsed.deliverySettings,
      };
    }
    return parsed;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: SiteSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ─── Orders ──────────────────────────────────────────────────
export function getOrders(): Order[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(ORDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: Order): void {
  if (typeof window === 'undefined') return;
  const orders = getOrders();
  const exists = orders.some(o => o.id === order.id);
  if (!exists) {
    orders.unshift(order); // yangi buyurtma boshida
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }
}

export function saveAllOrders(orders: Order[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function updateOrderStatus(id: string, status: Order['status']): void {
  if (typeof window === 'undefined') return;
  const orders = getOrders().map(o => o.id === id ? { ...o, status } : o);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function deleteOrder(id: string): void {
  if (typeof window === 'undefined') return;
  const orders = getOrders().filter(o => o.id !== id);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

// ─── Reviews (Baholar va Izohlar) ─────────────────────────────
export function getReviews(): Review[] {
  if (typeof window === 'undefined') return defaultReviews;
  try {
    const stored = localStorage.getItem(REVIEWS_KEY);
    return stored ? JSON.parse(stored) : defaultReviews;
  } catch {
    return defaultReviews;
  }
}

export function saveReview(review: Review): void {
  if (typeof window === 'undefined') return;
  const current = getReviews();
  const updated = [review, ...current];
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));
}

export function deleteReview(id: string): void {
  if (typeof window === 'undefined') return;
  const reviews = getReviews().filter(r => r.id !== id);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
}

export function getProductRating(productId: string): { avg: number; count: number } {
  const reviews = getReviews().filter(r => r.targetType === 'product' && r.targetId === productId);
  if (reviews.length === 0) return { avg: 5.0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    avg: Number((sum / reviews.length).toFixed(1)),
    count: reviews.length,
  };
}

export function getServiceRating(): { avg: number; count: number } {
  const reviews = getReviews();
  if (reviews.length === 0) return { avg: 5.0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    avg: Number((sum / reviews.length).toFixed(1)),
    count: reviews.length,
  };
}

// ─── Helpers ─────────────────────────────────────────────────
export function fmt(n: number): string {
  return Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function formatPrice(price: number): string {
  return fmt(price) + " so'm";
}

export function formatWeight(weightG: number): string {
  if (weightG >= 1000) {
    const kg = weightG / 1000;
    return kg % 1 === 0 ? `${kg} kg` : `${kg.toFixed(1)} kg`;
  }
  return `${weightG} g`;
}

export function calcItemPrice(pricePerKg: number, weightG: number): number {
  return Math.round((pricePerKg * weightG) / 1000);
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${day}.${month}.${year}`;
}

export function generateOrderId(): string {
  const now = new Date();
  const date = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 900) + 100;
  return `HG-${date}-${rand}`;
}
