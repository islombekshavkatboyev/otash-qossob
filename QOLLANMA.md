# 📖 Halol Go'sht — To'liq Foydalanish Qo'llanmasi

> Ushbu qo'llanma texnik bilimisiz ham saytdan foydalanish, buyurtmalarni boshqarish va tizimga kirish uchun mo'ljallangan.

---

## 🚀 Saytni Ishga Tushirish

### Talablar
- **Node.js** o'rnatilgan bo'lishi kerak (https://nodejs.org)
- **Terminal / PowerShell** — Windows da ishlatiladi

### 1-qadam — Papkaga kiring
```powershell
cd "c:\Users\user\Desktop\Otash qossob\obmeathaus"
```

### 2-qadam — Kutubxonalarni o'rnating (birinchi marta)
```powershell
npm install
```

### 3-qadam — Serverni ishga tushiring
```powershell
npm run dev
```

Muvaffaqiyatli bo'lsa terminalda quyidagicha ko'rinadi:
```
▲ Next.js 16.4.3
- Local: http://localhost:3000
✓ Ready in 1319ms
```

### 4-qadam — Brauzerda oching
Brauzeringizga manzilni kiriting:

| Sahifa | Manzil |
|--------|--------|
| 🏪 Asosiy do'kon | http://localhost:3000 |
| 🔐 Admin kirish | http://localhost:3000/admin/login |
| 📊 Admin panel | http://localhost:3000/admin |

> **Serverni to'xtatish:** Terminalda `Ctrl + C` bosing.

---

## 🔐 Admin Panelga Kirish

### Login Ma'lumotlari

| | |
|---|---|
| 🌐 **Manzil** | http://localhost:3000/admin/login |
| 👤 **Login (foydalanuvchi nomi)** | `admin` |
| 🔑 **Parol** | `halolgosht2026` |

### Kirish Jarayoni
1. Brauzerda **http://localhost:3000/admin/login** ga o'ting
2. **Foydalanuvchi nomi** maydoniga: `admin`
3. **Parol** maydoniga: `halolgosht2026`
4. **"Kirish →"** tugmasini bosing
5. Admin panelga o'tasiz ✅

### ⚠️ Xavfsizlik Ogohlantirishlari
- Agar **5 marta noto'g'ri** parol kiritsangiz → hisob **15 daqiqa** bloklanadi
- Parolni o'zgartirish uchun `.env.local` faylini oching (quyida ko'rsatilgan)
- Chiqish uchun Admin panelning chap menusidagi **"🚪 Chiqish"** tugmasini bosing

---

## 🔧 Login va Parolni O'zgartirish

📁 **Fayl:** `.env.local` (loyiha papkasining asosiy papkasida)

```
ADMIN_USERNAME=admin           ← Login nomini shu yerda o'zgartiring
ADMIN_PASSWORD=halolgosht2026  ← Parolni shu yerda o'zgartiring
JWT_SECRET=halol-gosht-jwt-secret-2026-change-me  ← Bu kalit (o'zgartirish tavsiya etiladi)
```

**Parol o'zgartirgandan keyin serverni qayta ishga tushiring:**
```powershell
Ctrl + C    (serverni to'xtatish)
npm run dev (qayta ishga tushirish)
```

---

## 📊 Admin Panel Funksiyalari

Admin panel **5 ta bo'lim**dan iborat (chapda menyu):

### 📦 1. Mahsulotlar (Products)
- Narxlarni o'zgartirish (1 kg narxi)
- Mahsulotni yoqish/o'chirish (Mavjud / Tugadi)
- Yangi mahsulot qo'shish
- Mahsulotni o'chirish

### 📋 2. Buyurtmalar (Orders)
Mijozlarning barcha buyurtmalari shu yerda ko'rinadi.

**Buyurtma holatlari:**
| Holat | Ma'nosi |
|-------|---------|
| 🆕 Yangi | Yangi kelgan buyurtma |
| ✅ Tasdiqlandi | Qabul qilindi |
| 👨‍🍳 Tayyorlanmoqda | Go'sht tayyorlanmoqda |
| 🚗 Yetkazilmoqda | Kuryer yo'lda |
| ✓ Bajarildi | Buyurtma yetkazildi |
| ✗ Bekor qilindi | Bekor qilingan |

### ⭐ 3. Izohlar va Baholar (Reviews)
- Xaridorlar qoldirgan yulduzchalar va fikrlar
- O'rtacha reyting balli (masalan, 5.0) va 1-5 yulduz taqsimoti statistikasi
- Barcha izohlarni ko'rish va nojo'ya izohlarni o'chirish (🗑️) imkoniyati

### 🚚 4. Yetkazib berish (Delivery)
- Samarqand va Urgut uchun narxlarni o'zgartirish
- Tekin yetkazish chegarasini o'zgartirish
- Yetkazish vaqtini (daqiqada) o'zgartirish

### ⚙️ 5. Sozlamalar (Settings)
- Do'kon nomi, telefon, manzil, ish vaqti
- **Telegram Bot token, Chat ID va Username** — buyurtmalar Telegramga ketishi uchun:
  - Bot: `@halolgoshtyetkazishbot`
  - Token: `9057174699:AAFZXhyddBXk4pf-caIjev1W4nd5sg0K2_U`
  - Chat ID: `6985755311`
  - Aloqa: `@Otabek07092000`

---

## ☀️ / 🌙 Kun va Tun Rejimi (Light & Dark Mode)
- Yuqori o'ng burchakdagi **☀️ / 🌙** tugmasi orqali istalgan paytda yorqin kunduzgi rejim va zamonaviy qorong'u tungi rejim o'rtasida almashish mumkin.
- Tanlangan rejim brauzerda avtomatik saqlanadi.

---

## 🛒 Mijoz Tomonidan Buyurtma Berish Jarayoni

```
1. Saytga kiradi → http://localhost:3000
2. Mahsulot tanlaydi → kg / gramm kiritadi
3. "Savatga qo'shish" tugmasini bosadi
4. Savat ikonkasini bosadi → Savat ochiladi
5. "Buyurtma berish" tugmasini bosadi
6. Shaklni to'ldiradi:
   - Ism va familiya
   - Telefon raqam
   - Yetkazish yoki olib ketish
   - Manzil (yetkazish bo'lsa)
   - To'lov turi
   - GPS lokatsiya (ixtiyoriy) ← "📍 Joylashuvimni aniqlash"
7. "✅ Buyurtmani tasdiqlash" bosadi
8. Buyurtma → Admin panelga + Telegram botga ketadi
```

---

## 📍 GPS Lokatsiya Funksiyasi

Mijoz buyurtma berayotganda **"📍 Joylashuvimni aniqlash"** tugmasini bosishi mumkin.

- Brauzer GPS ruxsatini so'raydi → Mijoz **"Ruxsat berish"** bosadi
- Koordinatalar aniqlanadi va **Google Maps havolasi** yaratiladi
- Buyurtmada va Telegram xabarida ko'rinadi: `📍 https://maps.google.com/?q=...`
- Admin panelda buyurtma kartasida **"GPS: ..."** sifatida chiqadi

---

## 📱 Telegram Bot Ulash

Buyurtmalar Telegramga kelishi uchun:

1. **Admin panel → Sozlamalar** tabiga o'ting
2. Quyidagi maydonlarni to'ldiring:
   - **Telegram Bot Token** — `@BotFather` orqali olasiz
   - **Telegram Chat ID** — Botingizga `/start` yozib, `@userinfobot` orqali aniqlanadi
3. **"Sozlamalarni saqlash"** tugmasini bosing

**Yangi buyurtma kelganda Telegramga quyidagi xabar keladi:**
```
🆕 YANGI BUYURTMA — #HG-20261114-001

👤 Mijoz: Alisher Karimov
📞 Tel: +998901234567
🏠 Manzil: Samarqand, Registon ko'chasi 5 (Samarqand shahri)
💳 To'lov: Naqd pul

Mahsulotlar:
  🥩 Mol go'shti — 1.5 kg = 195 000 so'm
  🥩 Qo'y go'shti — 500 g = 60 000 so'm

📦 Mahsulotlar: 255 000 so'm
🚗 Yetkazib berish: 15 000 so'm
💰 JAMI: 270 000 so'm

📍 Joylashuv: https://maps.google.com/?q=39.6547,66.9758
```

---

## 🛠️ Tez-tez Ishlatiladigan Buyruqlar

```powershell
# 1. Asosiy web-saytni ishga tushirish (http://localhost:3000)
npm run dev

# 2. Telegram botni ishga tushirish (@halolgoshtyetkazishbot)
npm run bot

# 3. TypeScript xatolarini tekshirish
npx tsc --noEmit

# 4. Paketlarni o'rnatish (birinchi marta)
npm install
```

---

## 🤖 Telegram Bot Boshqaruvi va Imkoniyatlari

📁 **Fayl:** `scripts/bot.mjs`  
🤖 **Bot:** `@halolgoshtyetkazishbot`  
🔑 **Bot Token:** `9057174699:AAFZXhyddBXk4pf-caIjev1W4nd5sg0K2_U`  
👤 **Admin Chat ID:** `6985755311`  
✈️ **Admin Telegram:** `@Otabek07092000`

### Bot qanday ishlaydi:
1. **📦 Buyurtmam holati:** Mijoz telefon raqami yoki buyurtma ID raqami (`HG-...`) yuborganida, uning barcha tanlagan go'shtlari, vaznlari, umumiy narxi va hozirgi bosqichi (🆕 Yangi, ✅ Tasdiqlandi, 👨‍🍳 Tayyorlanmoqda, 🚗 Yetkazilmoqda, ✓ Yetkazib berildi) chiqadi.
2. **🥩 Mahsulotlar narxi:** Barcha go'sht turlarining 1 kg narxlari, sifat tavsifi va buyurtma berish tugmalari ko'rsatiladi.
3. **⭐ Xizmatni baholash:** Admin panelda buyurtma "Yetkazib berildi" holatiga o'tkazilganda yoki botda tekshirilganda, mijozga 1-5 yulduzli baholash tugmalari chiqadi. Baho avtomatik tarzda `data/reviews.json` ga saqlanadi, adminga xabar boradi va saytda ko'rinadi!
4. **🔗 Sayt bilan bog'liqlik:** Saytda buyurtma berilgach, mijoz "🤖 Botda kuzatish" tugmasini bossa, bot darhol uning buyurtmasini ochadi.

---

## 📁 Muhim Fayllar Jadvali

| Fayl | Nima uchun |
|------|-----------|
| `.env.local` | **Login, parol, JWT kalit, Telegram kalitlari** |
| `data/orders.json` | Buyurtmalar bazasi (sayt va bot o'rtasida umumiy) |
| `data/reviews.json` | Mijozlar baholari va yulduzchalari |
| `scripts/bot.mjs` | Telegram bot kodi (polling va buyurtmalar/baholar) |
| `app/data/products.ts` | Mahsulotlar va boshlang'ich sozlamalar |
| `app/admin/page.tsx` | Admin panel kodi |
| `app/admin/login/page.tsx` | Login sahifasi kodi |
| `app/checkout/page.tsx` | Buyurtma berish va botga ulanish sahifasi |
| `app/components/Navbar.tsx` | Kun/Tun rejimini almashtirish va menyu |

---

## ❓ Tez-tez So'raladigan Savollar

**Q: Saytni internetga chiqarish mumkinmi?**
A: Ha — Vercel, Netlify yoki VPS serverga joylashtirish mumkin. `.env.local` faylini serverda ham sozlash kerak.

**Q: Parolni unutdim, nima qilaman?**
A: `.env.local` faylini oching → `ADMIN_PASSWORD=yangi_parol` yozing → serverni qayta ishga tushiring.

**Q: Buyurtmalar qaerda saqlanadi?**
A: Hozircha brauzerning **localStorage** xotirasida. Brauzer tozalanmasa, ma'lumotlar saqlanib qoladi.

**Q: GPS ishlamayapti?**
A: Brauzer GPS ruxsatini so'rashi kerak. Agar so'ramasa: Brauzer manzil satrida 🔒 ikonkasini bosing → Location → Allow.

---

*Halol Go'sht © 2026 — Islombek Shavkatboyev, Otabek Shavkatboyev. Next.js 16, TypeScript, CSS Modules*

