# 🛠️ Halol Go'sht — Kodni o'z qo'lingiz bilan tahrirlash yo'riqnomasi

Ushbu yo'riqnoma orqali siz loyihadagi matnlar, narxlar, rasmlar, telefon raqamlari, ranglar va boshqa qismlarni mustaqil ravishda o'zgartirishingiz mumkin.

---

## 📌 Asosiy qoidalar:
1. Har bir o'zgartirishdan so'ng klaviaturada **`Ctrl + S`** (Saqlash) tugmasini bosing.
2. Server ishlayotgan bo'lsa (`npm run dev`), brauzerdagi sahifa avtomatik ravishda yangilanadi.
3. Vergullar (`,`), qo'shtirnoqlar (`""` yoki `''`) va qavslarni (`{}`, `[]`) o'chirib yubormaslikka e'tibor bering.

---

## 1. Mahsulotlar, narxlar va rasmlarni o'zgartirish
📁 **Fayl:** `app/data/products.ts`

Bu faylda saytning standart mahsulotlari saqlanadi. 

### Misol: Narx yoki nomini o'zgartirish:
Faylni oching va `defaultProducts` ro'yxatidan kerakli mahsulotni toping:

```typescript
{
  id: '1',
  name: "Mol go'shti",               // <-- Mahsulot nomi
  nameUz: "Mol go'shti",
  description: "Yangi va sifatli...", // <-- Mahsulot tavsifi
  price: 130000,                      // <-- 1 kg narxi (so'mda)
  image: 'https://images.unsplash.com/...', // <-- Rasm havolasi (URL)
  category: 'mol',                    // <-- Kategoriya (mol, qoy, tovuq, qiyma, kabob, suyakli)
  unit: 'kg',
  inStock: true,                      // <-- true (mavjud) yoki false (tugagan)
  badge: 'Bestseller',                // <-- 'Bestseller', 'Yangi' yoki bo'sh qoldirish mumkin
}
```

* **Yangi mahsulot qo'shish:** Yangi blokni `{ ... }` ko'rinishida oxirgi mahsulotdan keyin vergul qo'yib qo'shasiz.

---

## 2. Telefon raqami, manzil va ish vaqti
📁 **Fayl:** `app/data/products.ts` (faylning 104-qatoridan boshlab)

`defaultSettings` obyektini toping:

```typescript
export const defaultSettings: SiteSettings = {
  storeName: "Halol Go'sht",
  phone: '+998906168712',                  // <-- Asosiy telefon raqami
  telegram: 'https://t.me/halolgosht',     // <-- Telegram kanal yoki profil havolasi
  address: "Samarqand sh., Urgut tumani",  // <-- Do'kon manzili
  workingHours: '07:00 - 22:00',           // <-- Ish vaqti
  ...
}
```

---

## 3. Yetkazib berish narxlari (Samarqand va Urgut)
📁 **Fayl:** `app/data/products.ts`

`deliverySettings` ichidagi zonalarni o'zgartiring:

```typescript
zones: [
  {
    id: 'samarqand',
    name: 'Samarqand shahri',
    price: 15000,      // <-- Yetkazib berish narxi (so'm)
    minTime: 30,       // <-- Min vaqt (daqiqa)
    maxTime: 60,       // <-- Max vaqt (daqiqa)
    freeFrom: 300000,  // <-- Necha so'mdan oshsa yetkazish TEKIN bo'ladi
  },
  {
    id: 'urgut',
    name: 'Urgut tumani',
    price: 25000,      // <-- Urgut uchun narx
    minTime: 45,
    maxTime: 90,
    freeFrom: 400000,  // <-- Urgut uchun tekin yetkazish chegarasi
  },
]
```

---

## 4. Yuqori qism (Navbar) — Logo va tugmalar
📁 **Fayl:** `app/components/Navbar.tsx`

* **Logo matni (30-31 qatorlar):**
  ```tsx
  <span className={styles.logoMain}>Halol</span>
  <span className={styles.logoSub}>Go&apos;sht</span>
  ```
* **Qo'ng'iroq tugmasidagi raqam (49-51 qatorlar):**
  ```tsx
  <a href="tel:+998906168712" className={styles.phoneBtn}>
    <span>📞</span>
    <span>+998 90 616 87 12</span>
  </a>
  ```

---

## 5. Katta asosiy banner (Hero qismi)
📁 **Fayl:** `app/components/Hero.tsx`

* **Asosiy sarlavha (30-34 qatorlar):**
  ```tsx
  <h1 className={styles.heroTitle}>
    Har doim yangi va{' '}
    <span className={styles.heroHighlight}>halol go'sht</span>{' '}
    mahsulotlari
  </h1>
  ```
* **Statistika raqamlari (55-67 qatorlar):**
  `500+` (Mamnun mijozlar), `6` (Go'sht turlari) kabi sonlarni o'zgartirishingiz mumkin.
* **Fon rasmi:** `app/components/Hero.module.css` faylida 12-qatordagi Unsplash rasm URL manzilini almashtirishingiz mumkin.

---

## 6. Vazn tanlash tugmalari (gramm / kg)
📁 **Fayl:** `app/components/WeightSelector.tsx`

Faylning 7-qatorida:
```typescript
const QUICK_WEIGHTS = [250, 500, 1000, 1500, 2000, 3000];
```
Bu yerda vaznlar **grammda** ko'rsatilgan:
* `250` = 250 gramm
* `500` = 0.5 kg
* `1000` = 1 kg
* `2000` = 2 kg
* `5000` qo'shsangiz, saytda **5 kg** tugmasi paydo bo'ladi.

---

## 7. Bosh sahifadagi matnlar va "Nima uchun biz?"
📁 **Fayl:** `app/page.tsx`

* **Kategoriyalar ro'yxati (24-32 qatorlar):**
  ```typescript
  const categories = [
    { id: 'all',     label: 'Hammasi',     emoji: '🥩' },
    { id: 'mol',     label: "Mol go'shti",  emoji: '🐄' },
    ...
  ];
  ```
* **"Nima uchun biz?" afzalliklar ro'yxati (161-167 qatorlar):**
  ```typescript
  [
    "🥩 Yangi va halol mahsulotlar",
    "⚖️ Aniq vazn, to'g'ri hisob",
    "🚀 Tezkor yetkazib berish",
    "💯 100% sifat kafolati",
    "📞 24/7 mijozlar xizmati",
  ]
  ```
* **Tajriba yili (186-qatorda):** `5+` o'rniga boshqa son yozishingiz mumkin.

---

## 8. Sayt ranglari va dizaynini o'zgartirish
📁 **Fayl:** `app/globals.css` (3-30 qatorlar)

Butun sayt ranglari shu yerdagi o'zgaruvchilarga bog'langan:
```css
:root {
  --primary: #c0392b;       /* Asosiy qizil rang */
  --primary-light: #e74c3c; /* Och qizil rang */
  --accent: #f39c12;        /* Sariq/olovrang urg'u */
  --green: #27ae60;         /* Yashil rang (savat tugmasi) */
  --bg: #0a0a0a;            /* Asosiy fon rangi (qora) */
  --bg-card: #141414;       /* Kartochkalar foni */
  --text-primary: #f5f5f5;  /* Asosiy yozuv rangi (oq) */
}
```
Rang kodini (HEX kodini) o'zgartirsangiz, butun saytdagi mos elementlar rangi bir zumda o'zgaradi.

---

## 9. Buyurtma formasidagi Telegram xabari matni
📁 **Fayl:** `app/checkout/page.tsx` (76-90 qatorlar)

Telegram botga yuboriladigan xabar shablonini shu yerdan o'zingizga moslab tahrirlashingiz mumkin.


---

## 10. Admin login va parolini o'zgartirish
📁 **Fayl:** `.env.local` (loyiha asosiy papkasida)

Admin panelga kirish parolini o'zgartirish uchun shu faylni oching:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=halolgosht2026
JWT_SECRET=halol-gosht-jwt-secret-2026-change-me
```

- `ADMIN_USERNAME` — Kirish logini (masalan: `boshliq` yoki `admin`)
- `ADMIN_PASSWORD` — Kirish paroli (istalgan yangi parolingiz)
- `JWT_SECRET` — Tizim sessiya kaliti

> ⚠️ **Muhim:** Parolni o'zgartirgandan keyin terminalda `Ctrl + C` bosib, qaytadan `npm run dev` qilib serverni o'chirib-yoqish kerak.

---

## 11. GPS Lokatsiya va Xaritalar
📁 **Fayl:** `app/checkout/page.tsx`

Xaridor buyurtma berishda joylashuvini ulashsa, koordinatalar avtomatik tarzda Google Maps formatida admin panelga va Telegram bot xabariga tushadi:
`https://maps.google.com/?q={lat},{lng}`

Kuryer yoki admin ushbu havolani bitta bosish orqali to'g'ridan-to'g'ri navigatorga ulanadi va mijozning uyigacha bo'lgan yo'nalishni ko'radi.
