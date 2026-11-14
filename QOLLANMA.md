# 📖 Halol Go'sht — To'liq Foydalanish va Sozlash Qo'llanmasi

> Ushbu qo'llanma loyihani ishga tushirish, boshqarish, GitHub va Vercel'ga deploy qilish, hamda Telegram bot bilan ishlash bo'yicha to'liq qo'llanmadir.

---

## 🚀 1. Saytni Kompyuterda Ishga Tushirish

### Talablar
- **Node.js** (18.x yoki 20.x+) — [Yuklab olish](https://nodejs.org)
- **PowerShell / Terminal** — Windows da

### Ishga tushirish buyruqlari:
```powershell
# 1. Papkaga o'tish
cd "c:\Users\user\Desktop\Otash qossob\obmeathaus"

# 2. Paketlarni o'rnatish (birinchi marta)
npm install

# 3. Saytni ishga tushirish (http://localhost:3000)
npm run dev

# 4. Telegram botni alohida terminalda ishga tushirish
npm run bot
```

---

## 🔐 2. Admin Panelga Kirish

| Maydon | Qiymat |
|---|---|
| 🌐 **Manzil** | `http://localhost:3000/admin/login` (yoki Vercel havolasida `/admin/login`) |
| 👤 **Login** | `admin` |
| 🔑 **Parol** | `halolgosht2026` |

> **Xavfsizlik:** 5 marta ketma-ket noto'g'ri parol kiritilsa, tizim IP manzilni 15 daqiqaga bloklaydi. Parolni o'zgartirish `.env.local` orqali amalga oshiriladi.

---

## 📊 3. Admin Panel Funksiyalari

- **🥩 Mahsulotlar:** Narxlarni o'zgartirish (1 kg narxi), mavjudligini o'chirish/yoqish, yangi go'sht turlarini qo'shish.
- **📦 Buyurtmalar:** 
  - **Holat filtrlari:** `Barchasi`, `🆕 Yangi`, `🚗 Yetkazilmoqda`, `✓ Bajarildi`.
  - **`🔄 Yangilash` tugmasi:** Serverdagi barcha yangi buyurtmalarni bir zumda qayta yuklaydi.
  - Har bir buyurtmada: mijoz ismi, telefoni, to'lov turi, manzili va **GPS xaritasi** aks etadi.
- **⭐ Izohlar va Baholar:** Mijozlarning yulduzcha va sharhlari, reyting statistikasi.
- **🚗 Yetkazib berish:** Samarqand va Urgut zonalari narxlari, tekin yetkazish limiti.
- **⚙️ Sozlamalar:** Do'kon ma'lumotlari va Telegram bot kalitlari.

---

## 🤖 4. Telegram Bot Boshqaruvi va Imkoniyatlari

- 🤖 **Bot Username:** `@halolgoshtyetkazishbot`
- 🔑 **Bot Token:** `9057174699:AAFZXhyddBXk4pf-caIjev1W4nd5sg0K2_U`
- 👥 **Administratorlar (Chat ID):**
  - **Admin 1:** `6985755311` (@Otabek07092000)
  - **Admin 2:** `8774620555`

### ⚡ 24/7 Rejim (Kompyuter o'chiq bo'lganda ham ishlashi):
Bot Vercel bulutida **Telegram Webhook** orqali ishlaydi (`https://otash-qossob.vercel.app/api/telegram/webhook`).
- Siz noutbuk yoki kompyuteringizni o'chirib qo'ysangiz ham, Telegram har bir xabar va tugma bosilishini to'g'ridan-to'g'ri Vercel bulutiga uzatadi.
- Shu sababli kompyuterda `npm run bot` ni yoqib o'tirish shart emas — bot kunu-tun (24/7) avtomatik ishlaydi!

### Botning asosiy imkoniyatlari:
1. **Parallel yangi buyurtma bildirishnomasi:** Saytdan yangi buyurtma tushganda ikkala adminga parallel xabar va Google Maps pin jo'natiladi.
2. **Botda interaktiv boshqaruv:** Adminlar xabar ostidagi `✅ Qabul qilish`, `👨‍🍳 Tayyorlash`, `🚗 Kuryer yo'lda`, `✓ Yetkazildi` tugmalari orqali buyurtma holatini Telegram'dan chiqmasdan boshqara oladi.
3. **Mijoz uchun aqlli qidiruv:**
   - Mijoz `📦 Buyurtmam holati` tugmasini bossa, bot mijozdan qayta telefon so'ramasdan uning buyurtmasini darhol ko'rsatadi.
   - Telefon raqami har qanday formatda kiritilsa ham (`+998993545108` yoki `993545108`), oxirgi 9 ta raqam bo'yicha 100% topadi.
4. **Takroriy xabarlardan himoya:** Barcha xabarlarda idempotentlik va `skipTelegram` filtri mavjud, mijozga xabarlar takrorlanib bormaydi.
5. **Saytga to'g'ridan-to'g'ri o'tish (Telegram WebApp):** `🛒 Do'konga kirish` tugmasi orqali sayt ochilganda mijozning Telegram ID si saytga avtomatik uzatiladi.

---

## ☁️ 5. Vercel va GitHub Bilan Ishlash

- **GitHub Repozitoriy:** `https://github.com/islombekshavkatboyev/otash-qossob`
- **Tarmoq:** `main`

### O'zgarishlarni GitHub va Vercel'ga chiqarish:
```powershell
cd "c:\Users\user\Desktop\Otash qossob\obmeathaus"
git add .
git commit -m "yangi o'zgarish tavsifi"
git push origin main
```
`git push` qilinishi bilanoq **Vercel** 1–2 daqiqada yangi versiyani avtomatik deploy qiladi.

### Vercel Muhit O'zgaruvchilari (Environment Variables):
- `TELEGRAM_BOT_TOKEN` = `9057174699:AAFZXhyddBXk4pf-caIjev1W4nd5sg0K2_U`
- `TELEGRAM_CHAT_ID` = `6985755311,8774620555`
- `ADMIN_USERNAME` = `admin`
- `ADMIN_PASSWORD` = `halolgosht2026`

---

## 📁 6. Muhim Fayllar Tuzilishi

| Fayl / Papka | Vazifasi |
|---|---|
| `app/checkout/page.tsx` | Buyurtma rasmiylashtirish, GPS aniqlash, Telegramga yuborish |
| `app/admin/page.tsx` | Veb admin panel (mahsulotlar, buyurtmalar, sharhlar, sozlamalar) |
| `app/api/orders/route.ts` | Buyurtmalarni saqlash va olish server API |
| `app/api/orders/status/route.ts` | Buyurtma holatini yangilash va mijozga bildirishnoma jo'natish |
| `app/api/telegram/order/route.ts` | Yangi buyurtmani adminlarga yuboruvchi API |
| `app/api/telegram/webhook/route.ts` | Vercel uchun bulutli Telegram Webhook marshruti |
| `app/lib/db.ts` | Lokal va Vercel serverless fayl bazasi adapteri |
| `scripts/bot.mjs` | Telegram bot servisi (polling, menyu, qidiruv, boshqaruv) |
| `data/orders.json` | Lokal buyurtmalar bazasi |
| `data/reviews.json` | Baholar va sharhlar bazasi |

---
*Halol Go'sht © 2026 — Samarqand va Urgut. Barcha huquqlar himoyalangan.*
