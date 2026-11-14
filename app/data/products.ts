// ============================================================
// Halol Go'sht — ma'lumotlar bazasi
// ============================================================

export interface Product {
  id: string;
  name: string;
  nameUz: string;
  description: string;
  price: number;      // so'm / kg
  image: string;
  category: string;
  unit: string;       // 'kg'
  inStock: boolean;
  badge?: string;     // 'Bestseller' | 'Yangi' | 'Chegirma'
}

// ─── Foydalanuvchi Baholari va Izohlari ────────────────────────
export interface Review {
  id: string;
  targetType: 'product' | 'service';
  targetId: string;       // productId yoki 'store' yoki 'service'
  targetName: string;     // "Mol go'shti", "Umumiy xizmat" va hk.
  userName: string;
  rating: number;         // 1..5 yulduz
  comment: string;
  createdAt: string;
}

// ─── Savat elementi ─────────────────────────────────────────
export interface CartItem {
  product: Product;
  weightG: number;    // gramm hisobida (500, 1000, 2500 …)
}

// ─── Buyurtma ───────────────────────────────────────────────
export interface OrderLocation {
  lat: number;
  lng: number;
  mapsLink: string;
  accuracy?: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  customerName: string;
  phone: string;
  address: string;
  deliveryType: 'delivery' | 'pickup';
  deliveryZone?: 'samarqand' | 'urgut';
  paymentType: 'cash' | 'card';
  note?: string;
  totalPrice: number;
  deliveryPrice: number;
  status: 'new' | 'confirmed' | 'cooking' | 'delivering' | 'done' | 'cancelled';
  createdAt: string;
  location?: OrderLocation;
  chatId?: string | number;
  rated?: boolean;
  rating?: number;
}

// ─── Yetkazib berish zonalari ────────────────────────────────
export interface DeliveryZone {
  id: 'samarqand' | 'urgut';
  name: string;
  price: number;
  minTime: number;
  maxTime: number;
  freeFrom: number;
}

export interface DeliverySettings {
  minTime: number;
  maxTime: number;
  freeDeliveryFrom: number;
  deliveryPrice: number;
  zones: DeliveryZone[];
}

export interface SiteSettings {
  storeName: string;
  phone: string;
  telegram: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  telegramBotUsername?: string;
  address: string;
  workingHours: string;
  deliverySettings: DeliverySettings;
}

// ─── Mahsulotlar ─────────────────────────────────────────────
export const defaultProducts: Product[] = [
  {
    id: '1',
    name: "Mol go'shti",
    nameUz: "Mol go'shti",
    description: "Yangi va sifatli mol go'shti, suyaksiz, toza tozalangan. Qovurish, qaynatish va kabob uchun ideal.",
    price: 130000,
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80',
    category: 'mol',
    unit: 'kg',
    inStock: true,
    badge: 'Bestseller',
  },
  {
    id: '2',
    name: "Qo'y go'shti",
    nameUz: "Qo'y go'shti",
    description: "Mazali va to'yimli qo'y go'shti. Sho'rva, dimlama va kabob uchun eng mos go'sht.",
    price: 150000,
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80',
    category: 'qoy',
    unit: 'kg',
    inStock: true,
  },
  {
    id: '3',
    name: "Tovuq go'shti",
    nameUz: 'Tovuq',
    description: "Toza va sifatli tovuq go'shti, yangi keltirilgan. Parhez uchun ham juda mos.",
    price: 100000,
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d11b36?auto=format&fit=crop&w=600&q=80',
    category: 'tovuq',
    unit: 'kg',
    inStock: true,
    badge: 'Yangi',
  },
  {
    id: '4',
    name: 'Qiyma',
    nameUz: "Qiyma go'sht",
    description: "Mol va qo'y go'shtidan maxsus tayyorlangan qiyma. Kotlet, so'msa va manti uchun tayyor.",
    price: 160000,
    image: 'https://images.unsplash.com/photo-1602473775917-1c6bdda7d3a1?auto=format&fit=crop&w=600&q=80',
    category: 'qiyma',
    unit: 'kg',
    inStock: true,
  },
  {
    id: '5',
    name: "Kaboblik go'sht",
    nameUz: 'Kaboblik',
    description: "Maxsus kabob uchun tayyorlangan go'sht. Yog'li va mazali, o'ziga xos ta'mi bor.",
    price: 150000,
    image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=600&q=80',
    category: 'kabob',
    unit: 'kg',
    inStock: true,
    badge: 'Bestseller',
  },
  {
    id: '6',
    name: "Suyakli go'sht",
    nameUz: "Suyakli go'sht",
    description: "Sho'rva uchun ideal suyakli go'sht. Mazali va to'yimli sho'rva pishirish uchun.",
    price: 79995,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    category: 'suyakli',
    unit: 'kg',
    inStock: true,
  },
];

// ─── Default sozlamalar ──────────────────────────────────────
export const defaultSettings: SiteSettings = {
  storeName: "Halol Go'sht",
  phone: '+998906168712',
  telegram: 'https://t.me/Otabek07092000',
  telegramBotToken: '9057174699:AAFZXhyddBXk4pf-caIjev1W4nd5sg0K2_U',
  telegramChatId: '6985755311',
  telegramBotUsername: 'halolgoshtyetkazishbot',
  address: "Samarqand sh., Urgut tumani",
  workingHours: '07:00 - 22:00',
  deliverySettings: {
    minTime: 30,
    maxTime: 60,
    freeDeliveryFrom: 300000,
    deliveryPrice: 15000,
    zones: [
      {
        id: 'samarqand',
        name: 'Samarqand shahri',
        price: 15000,
        minTime: 30,
        maxTime: 60,
        freeFrom: 300000,
      },
      {
        id: 'urgut',
        name: 'Urgut tumani',
        price: 25000,
        minTime: 45,
        maxTime: 90,
        freeFrom: 400000,
      },
    ],
  },
};

// ─── Buyurtma statuslari ─────────────────────────────────────
export const ORDER_STATUSES = {
  new: { label: 'Yangi', color: '#3498db', emoji: '🆕' },
  confirmed: { label: 'Tasdiqlandi', color: '#f39c12', emoji: '✅' },
  cooking: { label: 'Tayyorlanmoqda', color: '#e67e22', emoji: '🔪' },
  delivering: { label: 'Yetkazilmoqda', color: '#9b59b6', emoji: '🚗' },
  done: { label: 'Bajarildi', color: '#27ae60', emoji: '🎉' },
  cancelled: { label: 'Bekor qilindi', color: '#e74c3c', emoji: '❌' },
} as const;

// ─── Boshlang'ich Mijozlar Fikrlari va Baholari ──────────────
export const defaultReviews: Review[] = [
  {
    id: 'rev-1',
    targetType: 'product',
    targetId: '1',
    targetName: "Mol go'shti",
    userName: 'Rustam Bek',
    rating: 5,
    comment: "Go'sht juda yangi va yumshoq chiqdi. Qovurdoqqa ishlatdik, mazzasi og'izda qoldi. Rahmat katta!",
    createdAt: '2026-11-12T14:30:00.000Z',
  },
  {
    id: 'rev-2',
    targetType: 'service',
    targetId: 'service',
    targetName: 'Do\'kon va yetkazib berish xizmati',
    userName: 'Jasur Aliyev',
    rating: 5,
    comment: 'Urgutga 40 daqiqa ichida yetkazib berishdi. Kuryer muloyim, go\'sht muzdek va toza qadoqlangan.',
    createdAt: '2026-11-13T10:15:00.000Z',
  },
  {
    id: 'rev-3',
    targetType: 'product',
    targetId: '2',
    targetName: "Qo'y go'shti",
    userName: 'Dilshod Karimov',
    rating: 5,
    comment: 'Qo\'y go\'shtidan shashlik qildik, hech qanday yoqimsiz hidi yo\'q, chinakam halol va yangi mol.',
    createdAt: '2026-11-13T16:45:00.000Z',
  },
  {
    id: 'rev-4',
    targetType: 'product',
    targetId: '3',
    targetName: 'Qiyma (Mol)',
    userName: 'Nodira Mirzayeva',
    rating: 5,
    comment: 'Qiyma juda toza, ortiqcha yog\' va paylarsiz. Somsa uchun ishlatdik, juda shirin chiqdi.',
    createdAt: '2026-11-14T08:20:00.000Z',
  },
  {
    id: 'rev-5',
    targetType: 'service',
    targetId: 'service',
    targetName: 'Yetkazib berish va sifat',
    userName: 'Ziyoda Toshpo\'latova',
    rating: 5,
    comment: 'Vazni tarozida grammigacha aniq chiqdi. Halol va ishonchli xizmat. Doimiy mijozingiz bo\'lamiz!',
    createdAt: '2026-11-14T09:05:00.000Z',
  },
];
