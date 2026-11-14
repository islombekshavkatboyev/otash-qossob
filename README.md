# 🥩 Halol Go'sht — Onlayn Go'sht Do'koni

Samarqand shahri va Urgut tumani bo'yicha sifatli, halol va yangi go'sht mahsulotlarini tezkor yetkazib berish va do'kondan olib ketish tizimiga ega to'liq e-commerce veb-platformasi.

---

## 🛠️ Texnologiyalar Staki

- **Asosiy Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Dasturlash tili:** [TypeScript](https://www.typescriptlang.org/)
- **Dizayn & Stillar:** Zamonaviy Dark Theme, CSS Modules, Glassmorphism effektlari, responsive (mobil va desktop)
- **Autentifikatsiya:** Web Crypto API (HMAC-SHA256 JWT), HttpOnly Secure Cookies, Next.js Proxy/Middleware himoyasi
- **Xavfsizlik:** In-memory Rate Limiting (5 ta xato urinishdan so'ng 15 daqiqaga bloklash), Timing-Safe taqqoslash
- **Geolokatsiya:** HTML5 Geolocation API + Google Maps integratsiyasi
- **Bildirishnomalar:** Telegram Bot API integratsiyasi

---

## 🚀 Ishga Tushirish Qo'llanmasi

### 1. Talablar
Kompyuteringizda [Node.js](https://nodejs.org/) (18.x yoki undan yuqori) o'rnatilgan bo'lishi kerak.

### 2. O'rnatish va serverni yoqish
Terminal (PowerShell yoki CMD) ochib loyiha papkasiga kiring va quyidagi buyruqlarni bajaring:

```bash
# Loyiha papkasiga o'tish
cd "c:\Users\user\Desktop\Otash qossob\obmeathaus"

# Kerakli paketlarni o'rnatish (birinchi marta)
npm install

# Dasturchi serverini ishga tushirish
npm run dev
```

Server ishga tushgach, brauzeringizda quyidagi havolani oching:
👉 **http://localhost:3000**

---

## 🔐 Admin Panel va Kirish Ma'lumotlari

Admin panelga kirish orqali mahsulotlar narxini, mavjudligini o'zgartirishingiz, kelib tushgan buyurtmalarni (GPS koordinatalari bilan birga) ko'rishingiz mumkin:

- **Kirish manzili:** `http://localhost:3000/admin/login`
- **Foydalanuvchi nomi (Login):** `admin`
- **Parol:** `halolgosht2026`

> ⚠️ **Eslatma:** Login va parolni o'zgartirish uchun loyiha bosh ildizidagi `.env.local` faylini tahrirlang.

---

## 📁 Loyiha Tuzilmasi

```
obmeathaus/
├── .env.local                  # Admin parollari va maxfiy kalitlar
├── proxy.ts                    # Admin panelini himoyalovchi xavfsizlik darvozasi (proxy)
├── app/
│   ├── layout.tsx              # Asosiy sayt qobig'i va CartProvider
│   ├── page.tsx                # Bosh sahifa (Mahsulotlar katalogi, banner, afzalliklar)
│   ├── checkout/
│   │   └── page.tsx            # Buyurtma berish, GPS lokatsiyani aniqlash va Telegramga jo'natish
│   ├── admin/
│   │   ├── page.tsx            # Admin boshqaruv paneli (Buyurtmalar, Mahsulotlar, Sozlamalar)
│   │   └── login/
│   │       └── page.tsx        # Himoyalangan xavfsiz admin login sahifasi
│   ├── api/
│   │   └── auth/               # Login, logout va sessiya API nuqtalari
│   ├── components/             # Qayta ishlatiluvchi UI komponentlar (Navbar, ProductCard, CartDrawer, WeightSelector)
│   ├── context/                # Savat holatini boshqarish (CartContext)
│   ├── data/                   # Boshlang'ich mahsulotlar, narxlar va yetkazish zonalari
│   └── lib/                    # Storage (localStorage boshqaruvi) va Auth yordamchilari
├── QOLLANMA.md                 # Foydalanish bo'yicha to'liq qo'llanma
└── TAHRIRLASH_QOLLANMASI.md    # Kodni o'z qo'lingiz bilan tahrirlash bo'yicha yo'riqnoma
```

---

## 📄 Qo'shimcha Hujjatlar
- Batafsil ma'lumotlar va do'konni boshqarish: **[QOLLANMA.md](file:///c:/Users/user/Desktop/Otash%20qossob/obmeathaus/QOLLANMA.md)**
- Kodlarni va matnlarni mustaqil tahrirlash: **[TAHRIRLASH_QOLLANMASI.md](file:///c:/Users/user/Desktop/Otash%20qossob/obmeathaus/TAHRIRLASH_QOLLANMASI.md)**

