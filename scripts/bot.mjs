import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const ORDERS_FILE = path.join(ROOT, 'data', 'orders.json');
const REVIEWS_FILE = path.join(ROOT, 'data', 'reviews.json');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9057174699:AAFZXhyddBXk4pf-caIjev1W4nd5sg0K2_U';
const DEFAULT_ADMIN_IDS = ['6985755311', '8774620555'];
const envAdmins = process.env.TELEGRAM_CHAT_ID
  ? process.env.TELEGRAM_CHAT_ID.split(',').map(s => s.trim()).filter(Boolean)
  : [];
const ADMIN_IDS = Array.from(new Set([...DEFAULT_ADMIN_IDS, ...envAdmins]));
const isAdmin = (chatId) => ADMIN_IDS.map(String).includes(String(chatId));
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Ensure files exist
if (!fs.existsSync(path.dirname(ORDERS_FILE))) {
  fs.mkdirSync(path.dirname(ORDERS_FILE), { recursive: true });
}
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, '[]', 'utf8');
}
if (!fs.existsSync(REVIEWS_FILE)) {
  fs.writeFileSync(REVIEWS_FILE, '[]', 'utf8');
}

function getOrders() {
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving orders:', err);
  }
}

function getReviews() {
  try {
    return JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveReviews(reviews) {
  try {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving reviews:', err);
  }
}

const fmt = (n) => Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const STATUS_LABELS = {
  new: { label: 'Yangi qabul qilindi', emoji: '🆕', desc: 'Operator tomonidan tekshirilmoqda' },
  confirmed: { label: 'Tasdiqlandi', emoji: '✅', desc: 'Buyurtmangiz qabul qilindi' },
  cooking: { label: 'Tayyorlanmoqda', emoji: '👨‍🍳', desc: 'Sifatli go\'sht saralanib, qadoqlanmoqda' },
  delivering: { label: 'Yetkazilmoqda (Yo\'lda)', emoji: '🚗', desc: 'Kuryerimiz uyingiz tomon yo\'lda' },
  done: { label: 'Yetkazib berildi', emoji: '✓', desc: 'Buyurtma muvaffaqiyatli topshirildi' },
  cancelled: { label: 'Bekor qilingan', emoji: '❌', desc: 'Buyurtma bekor qilingan' },
};

// ─── Telegram API Wrappers ───────────────────────────────────
async function api(method, body = {}) {
  try {
    const res = await fetch(`${BASE_URL}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.ok) {
      console.error(`Telegram API error on ${method}:`, JSON.stringify(json));
    }
    return json;
  } catch (err) {
    console.error(`Telegram API fetch error on ${method}:`, err.message);
    return null;
  }
}

async function sendMessage(chatId, text, extra = {}) {
  return await api('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...extra,
  });
}

async function editMessageText(chatId, messageId, text, extra = {}) {
  return await api('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    ...extra,
  });
}

async function answerCallbackQuery(callbackQueryId, text = '', showAlert = false) {
  return await api('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text,
    show_alert: showAlert,
  });
}

// ─── Keyboards ───────────────────────────────────────────────
function getMainKeyboard(chatId) {
  const adminUser = isAdmin(chatId);
  const rows = [
    [{ text: '📦 Buyurtmam holati' }, { text: '🥩 Mahsulotlar narxi' }],
    [{ text: '🛒 Do\'konga kirish (Sayt)' }, { text: '📞 Aloqa va Manzil' }],
  ];
  if (adminUser) {
    rows.unshift([{ text: '📋 Barcha buyurtmalar (Admin)' }]);
  }
  return {
    reply_markup: {
      keyboard: rows,
      resize_keyboard: true,
    },
  };
}

const REQUEST_CONTACT_KEYBOARD = {
  reply_markup: {
    keyboard: [
      [{ text: '📱 Telefon raqamimni yuborish', request_contact: true }],
      [{ text: '📍 Lokatsiyamni yuborish', request_location: true }],
      [{ text: '🔙 Bosh menyu' }],
    ],
    resize_keyboard: true,
  },
};

// User interaction state (e.g. waiting for order id)
const userStates = new Map();

function parseOrderFromMessage(text, orderId) {
  const nameMatch = text.match(/Mijoz:\s*([^\n]+)/i);
  const phoneMatch = text.match(/Telefon:\s*([^\n]+)/i);
  const addressMatch = text.match(/Manzil:\s*([^\n]+)/i);
  const payMatch = text.match(/To'lov turi:\s*([^\n]+)/i);
  const noteMatch = text.match(/Izoh:\s*([^\n]+)/i);
  const totalMatch = text.match(/JAMI TO'LOV:\s*([^\n]+)/i);

  const cleanTotal = totalMatch ? parseInt(totalMatch[1].replace(/\D/g, ''), 10) || 0 : 0;

  return {
    id: orderId,
    customerName: nameMatch ? nameMatch[1].trim() : 'Mijoz',
    phone: phoneMatch ? phoneMatch[1].trim() : '',
    address: addressMatch ? addressMatch[1].trim() : 'Yetkazib berish',
    deliveryType: 'delivery',
    deliveryZone: 'samarqand',
    paymentType: payMatch && payMatch[1].toLowerCase().includes('karta') ? 'card' : 'cash',
    note: noteMatch ? noteMatch[1].trim() : '',
    totalPrice: cleanTotal,
    deliveryPrice: 0,
    status: 'new',
    createdAt: new Date().toISOString(),
    items: [],
  };
}

// ─── Helper: Get Order Text ─────────────────────────────────
function getOrderCardText(order) {
  const st = STATUS_LABELS[order.status] || STATUS_LABELS.new;

  let itemsText = '';
  if (Array.isArray(order.items)) {
    itemsText = order.items
      .map(i => {
        const pName = i.product?.name || i.productName || 'Go\'sht';
        const w = i.weightG ? (i.weightG >= 1000 ? `${i.weightG / 1000} kg` : `${i.weightG} g`) : '';
        const pr = i.product?.price ? (i.product.price * (i.weightG || 1000)) / 1000 : i.price || 0;
        return `  • <b>${pName}</b> ${w ? `(${w})` : ''} — ${fmt(pr)} so'm`;
      })
      .join('\n');
  }

  const lines = [
    `📦 <b>BUYURTMA: <code>${order.id}</code></b>`,
    '',
    `📊 <b>Holati:</b> ${st.emoji} <b>${st.label}</b>`,
    `ℹ️ <i>${st.desc}</i>`,
    '',
    `👤 <b>Mijoz:</b> ${order.customerName || 'Mijoz'}`,
    `📞 <b>Tel:</b> ${order.phone || ''}`,
    `🏠 <b>Manzil:</b> ${order.address || 'Yetkazib berish'}`,
    order.deliveryZone ? `🗺️ <b>Zona:</b> ${order.deliveryZone === 'samarqand' ? 'Samarqand shahri' : 'Urgut tumani'}` : '',
    `💳 <b>To'lov turi:</b> ${order.paymentType === 'cash' ? '💵 Naqd pul' : '💳 Karta'}`,
    order.note ? `📝 <b>Izoh:</b> ${order.note}` : '',
    '',
    `🥩 <b>Tanlangan mahsulotlar:</b>`,
    itemsText || '  • Go\'sht mahsulotlari',
    '',
    order.deliveryPrice ? `🚗 <b>Yetkazib berish:</b> ${fmt(order.deliveryPrice)} so'm` : '',
    `💰 <b>JAMI SUMMA:</b> <b>${fmt(order.totalPrice + (order.deliveryPrice || 0))} so'm</b>`,
    order.location?.mapsLink ? `\n📍 <b>GPS Lokatsiya:</b> <a href="${order.location.mapsLink}">Google Xaritada ko'rish 🗺️</a>` : '',
  ].filter(Boolean);

  if (order.status === 'done' && !order.rated) {
    lines.push('');
    lines.push('🎉 <b>Buyurtmangiz yetkazildi!</b>');
    lines.push('Iltimos, go\'sht sifati va yetkazish xizmatimizni baholang:');
  } else if (order.rated) {
    lines.push('');
    lines.push(`⭐ <b>Baho berilgan:</b> ${'★'.repeat(order.rating || 5)} (${order.rating || 5}/5) — Rahmat!`);
  }

  return lines.join('\n');
}

function getOrderInlineKeyboard(order, isAdmin) {
  if (isAdmin) {
    const rows = [
      [
        { text: '✅ Qabul qilish', callback_data: `st:confirmed:${order.id}` },
        { text: '👨‍🍳 Tayyorlash', callback_data: `st:cooking:${order.id}` },
      ],
      [
        { text: '🚗 Kuryer yo\'lda', callback_data: `st:delivering:${order.id}` },
        { text: '✓ Yetkazildi', callback_data: `st:done:${order.id}` },
      ],
    ];
    const subRow = [];
    if (order.location?.mapsLink) {
      subRow.push({ text: '📍 Xarita 🗺️', url: order.location.mapsLink });
    }
    subRow.push({ text: '❌ Bekor qilish', callback_data: `st:cancelled:${order.id}` });
    rows.push(subRow);
    return rows;
  }

  // Customer keyboard
  if (order.status === 'done' && !order.rated) {
    return [
      [
        { text: '⭐ 5 (A\'lo)', callback_data: `rate:5:${order.id}` },
        { text: '⭐ 4 (Yaxshi)', callback_data: `rate:4:${order.id}` },
      ],
      [
        { text: '⭐ 3 (O\'rtacha)', callback_data: `rate:3:${order.id}` },
        { text: '⭐ 2', callback_data: `rate:2:${order.id}` },
        { text: '⭐ 1', callback_data: `rate:1:${order.id}` },
      ],
    ];
  }

  if (order.location?.mapsLink) {
    return [[{ text: '📍 Xaritada ko\'rish 🗺️', url: order.location.mapsLink }]];
  }

  return null;
}

// ─── Message Handlers ────────────────────────────────────────
async function handleMessage(msg) {
  const chatId = msg.chat?.id;
  const text = msg.text?.trim();
  const userName = msg.from?.first_name || 'Mijoz';

  if (!chatId) return;

  // 1. Contact shared
  if (msg.contact?.phone_number) {
    const rawPhone = msg.contact.phone_number.replace(/\D/g, '');
    await showOrderByPhone(chatId, rawPhone, userName);
    userStates.delete(chatId);
    return;
  }

  // 2. Location shared (📍 GPS lokatsiya yuborildi)
  if (msg.location) {
    const { latitude, longitude } = msg.location;
    const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;

    const orders = getOrders();
    const userOrder = orders.find(
      o => (String(o.chatId) === String(chatId) || (msg.from?.id && String(o.chatId) === String(msg.from.id))) &&
           o.status !== 'done' && o.status !== 'cancelled'
    ) || orders[0];

    if (userOrder) {
      userOrder.location = { lat: latitude, lng: longitude, mapsLink };
      if (!userOrder.chatId) userOrder.chatId = chatId;
      saveOrders(orders);

      await sendMessage(
        chatId,
        `📍 <b>Lokatsiyangiz qabul qilindi va buyurtmaga biriktirildi!</b>\n\n📦 <b>Buyurtma ID:</b> <code>#${userOrder.id}</code>\n🔗 <a href="${mapsLink}">Google Xaritada ko'rish 🗺️</a>\n\nKuryerimiz siz yuborgan aniq manzil bo'yicha yetkazib beradi!`,
        getMainKeyboard(chatId)
      );

      // Forward to all Admins
      for (const adminId of ADMIN_IDS) {
        if (String(chatId) !== String(adminId)) {
          await sendMessage(
            adminId,
            `📍 <b>MIJOZDAN YANGI LOKATSIYA KELDI!</b>\n\n👤 Mijoz: <b>${userOrder.customerName || userName}</b>\n📞 Tel: <b>${userOrder.phone}</b>\n📦 Buyurtma: <code>#${userOrder.id}</code>\n🔗 <a href="${mapsLink}">Google Xaritada ochish 🗺️</a>`
          );
          await api('sendLocation', {
            chat_id: adminId,
            latitude,
            longitude,
          });
        }
      }
    } else {
      await sendMessage(
        chatId,
        `📍 <b>Lokatsiyangiz qabul qilindi:</b>\n<a href="${mapsLink}">Xaritada ochish 🗺️</a>`,
        getMainKeyboard(chatId)
      );
    }
    userStates.delete(chatId);
    return;
  }

  const lower = (text || '').toLowerCase().trim();

  // /start or Main Menu
  if (lower.startsWith('/start') || lower.includes('bosh menyu') || lower === 'menyu') {
    userStates.delete(chatId);

    // Deep-linking: /start <orderId>
    const parts = (text || '').split(' ');
    if (parts.length > 1 && parts[1].trim()) {
      const orderArg = parts[1].trim();
      await showOrderByIdOrPhone(chatId, orderArg, userName);
      return;
    }

    const adminUser = isAdmin(chatId);
    const welcome = [
      `🥩 <b>Assalomu alaykum, ${userName}!</b>`,
      '',
      `<b>"Halol Go'sht"</b> rasmiy yetkazib berish xizmati botiga xush kelibsiz!`,
      '',
      `Bu yerda siz:`,
      `• 🥩 Yangi va halol go'sht turlari narxini ko'rishingiz`,
      `• 📦 Buyurtmangiz tarkibi, <b>GPS lokatsiyasi</b> va <b>holatini (status)</b> kuzatishingiz`,
      `• ⭐ Yetkazib berilgach, sifat va xizmatimizni <b>baholashingiz</b> mumkin!`,
      adminUser ? '\n👨‍💼 <i>Siz tizimda Administrator sifatida tanildingiz. Barcha buyurtmalarni boshqarishingiz mumkin.</i>' : '',
      '',
      `Quyidagi tugmalardan birini tanlang:`,
    ].filter(Boolean).join('\n');

    await sendMessage(chatId, welcome, getMainKeyboard(chatId));
    return;
  }

  // Admin: Barcha buyurtmalar
  if (lower.includes('barcha buyurtmalar') || lower === '/orders' || lower === '/admin') {
    const orders = getOrders();
    if (orders.length === 0) {
      await sendMessage(chatId, `📭 Hozircha hech qanday buyurtma mavjud emas.`, getMainKeyboard(chatId));
      return;
    }

    const recent = orders.slice(0, 5);
    await sendMessage(chatId, `📋 <b>Oxirgi ${recent.length} ta buyurtmalar:</b>`);

    for (const ord of recent) {
      await sendOrderCard(chatId, ord);
    }
    return;
  }

  // 1. Buyurtma holati
  if (lower.includes('buyurtma') || lower === '/buyurtma') {
    userStates.set(chatId, 'WAITING_ORDER_SEARCH');
    const prompt = [
      `🔍 <b>Buyurtma holatini tekshirish:</b>`,
      '',
      `Iltimos, <b>telefon raqamingizni</b> yuboring yoki buyurtma berganingizda berilgan <b>ID raqamni</b> kiriting (masalan: <code>HG-261114-120</code>).`,
      '',
      `Pastdagi tugmalar orqali telefon yoki lokatsiyangizni ham yuborishingiz mumkin:`,
    ].join('\n');

    await sendMessage(chatId, prompt, REQUEST_CONTACT_KEYBOARD);
    return;
  }

  // 2. Mahsulotlar narxi
  if (
    lower.includes('narx') ||
    lower.includes('mahsulot') ||
    lower.includes('go\'sht') ||
    lower.includes('gosht') ||
    lower === '/mahsulotlar'
  ) {
    const productsText = [
      `🥩 <b>"HALOL GO'SHT" MAHSULOTLARI VA NARXLARI:</b>`,
      '',
      `1. 🐄 <b>Mol go'shti:</b> 130 000 so'm / kg`,
      `   <i>Yangi va toza suyaksiz mol go'shti, qovurish va qaynatishga ideal.</i>`,
      '',
      `2. 🐑 <b>Qo'y go'shti:</b> 150 000 so'm / kg`,
      `   <i>Mazali va to'yimli go'sht, sho'rva va dimlama uchun a'lo.</i>`,
      '',
      `3. 🐔 <b>Tovuq go'shti:</b> 100 000 so'm / kg`,
      `   <i>Toza va parhezbop tovuq go'shti.</i>`,
      '',
      `4. 🥩 <b>Qiyma:</b> 160 000 so'm / kg`,
      `   <i>Mol va qo'y go'shtidan maxsus tayyorlangan yumshoq qiyma.</i>`,
      '',
      `5. 🍖 <b>Kaboblik go'sht:</b> 150 000 so'm / kg`,
      `   <i>Maxsus tanlangan yumshoq lahm go'sht.</i>`,
      '',
      `6. 🦴 <b>Suyakli go'sht:</b> 79 995 so'm / kg`,
      `   <i>Maza beruvchi sho'rvalik to'yimli go'sht.</i>`,
      '',
      `🚗 <b>Yetkazib berish:</b> 30–60 daqiqa (Samarqand va Urgut bo'ylab)`,
      `⏰ <b>Ish vaqti:</b> Har kuni 07:00 – 22:00`,
      `📞 <b>Telefon:</b> +998 90 616 87 12`,
    ].join('\n');

    const siteUrl = `https://otash-qossob.vercel.app?tg_chat_id=${chatId}`;
    const extra = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛒 Onlayn do\'kon (Buyurtma berish)', web_app: { url: siteUrl } }],
          [
            { text: '🌐 Brauzerda ochish', url: siteUrl },
            { text: '📞 Bog\'lanish', url: 'https://t.me/Otabek07092000' },
          ],
          [{ text: '📦 Buyurtmam holatini tekshirish', callback_data: 'check_status' }],
        ],
      },
    };

    await sendMessage(chatId, productsText, extra);
    return;
  }

  // 3. Do'konga kirish (Sayt)
  if (lower.includes('do\'kon') || lower.includes('sayt') || lower === '/sayt') {
    const siteUrl = `https://otash-qossob.vercel.app?tg_chat_id=${chatId}`;
    const siteMsg = [
      `🌐 <b>Halol Go'sht onlayn do'koni</b>`,
      '',
      `Saytimiz orqali go'sht turlarini va aniq gramm/kg vaznini (500g, 1kg, 2.5kg...) tanlab, qulay buyurtma bering!`,
      `Shuningdek, aniq GPS lokatsiyangizni ham xaritadan yuborishingiz mumkin.`,
      '',
      `🚗 <b>Tezkor yetkazish:</b> 30-60 daqiqa`,
      `📞 <b>Operator:</b> +998 90 616 87 12`,
    ].join('\n');

    await sendMessage(chatId, siteMsg, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🥩 Onlayn do\'konni ochish 🛒', web_app: { url: siteUrl } }],
          [
            { text: '🌐 Brauzerda ochish', url: siteUrl },
            { text: '✈️ Administrator', url: 'https://t.me/Otabek07092000' },
          ],
          [{ text: '📦 Buyurtmam holati', callback_data: 'check_status' }],
        ],
      },
    });
    return;
  }

  // 4. Aloqa va Manzil
  if (lower.includes('aloqa') || lower.includes('manzil') || lower.includes('telefon') || lower === '/aloqa') {
    const contactMsg = [
      `🥩 <b>"Halol Go'sht" — Samarqand va Urgut</b>`,
      '',
      `📞 <b>Telefon:</b> +998 90 616 87 12`,
      `✈️ <b>Telegram aloqa:</b> @Otabek07092000`,
      `🤖 <b>Telegram bot:</b> @halolgoshtyetkazishbot`,
      `📍 <b>Manzil:</b> Samarqand sh., Urgut tumani`,
      `⏰ <b>Ish vaqti:</b> Har kuni 07:00 – 22:00`,
      '',
      `🚗 <b>Yetkazib berish vaqti:</b> 30–60 daqiqa`,
    ].join('\n');

    await sendMessage(chatId, contactMsg, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✈️ Telegram orqali yozish (@Otabek07092000)', url: 'https://t.me/Otabek07092000' }],
        ],
      },
    });
    return;
  }

  // User was waiting to search an order
  if (userStates.get(chatId) === 'WAITING_ORDER_SEARCH' || text.startsWith('HG-')) {
    const query = text.trim();
    await showOrderByIdOrPhone(chatId, query, userName);
    userStates.delete(chatId);
    return;
  }

  // Default fallback
  await sendMessage(
    chatId,
    `Tushunarsiz buyruq. Iltimos, pastdagi menyu tugmalaridan birini tanlang:`,
    getMainKeyboard(chatId)
  );
}

// ─── Order Search Helpers ────────────────────────────────────
async function showOrderByIdOrPhone(chatId, query, userName) {
  const orders = getOrders();
  const cleanQ = query.replace(/\D/g, '');

  const matched = orders.filter(o => {
    if (o.id && o.id.toLowerCase() === query.toLowerCase()) return true;
    if (cleanQ && o.phone && o.phone.replace(/\D/g, '').includes(cleanQ)) return true;
    return false;
  });

  if (matched.length === 0) {
    await sendMessage(
      chatId,
      `❌ <b>Buyurtma topilmadi.</b>\n\nKiritilgan ma'lumot: <code>${query}</code>\nIltimos, buyurtma ID raqami yoki buyurtma bergan telefoningizni to'g'ri kiriting.`,
      getMainKeyboard(chatId)
    );
    return;
  }

  const order = matched[0];
  if (order.chatId !== chatId && !isAdmin(chatId)) {
    order.chatId = chatId;
    saveOrders(orders);
    await sendMessage(chatId, `✅ <b>#${order.id}</b> raqamli buyurtmangiz ushbu Telegramingizga biriktirildi. Holat o'zgarganda sizga xabar yuboriladi!`);
  }
  await sendOrderCard(chatId, order);
}

async function showOrderByPhone(chatId, cleanPhone, userName) {
  const orders = getOrders();
  const matched = orders.filter(o => o.phone && o.phone.replace(/\D/g, '').includes(cleanPhone));

  if (matched.length === 0) {
    await sendMessage(
      chatId,
      `❌ Ushbu <b>+${cleanPhone}</b> raqamiga tegishli buyurtma topilmadi.\n\nAgar saytda boshqa raqam bilan buyurtma bergan bo'lsangiz, buyurtma ID raqamini (masalan: <code>HG-...</code>) yozib yuboring.`,
      getMainKeyboard(chatId)
    );
    return;
  }

  const order = matched[0];
  if (order.chatId !== chatId && !isAdmin(chatId)) {
    order.chatId = chatId;
    saveOrders(orders);
    await sendMessage(chatId, `✅ <b>#${order.id}</b> raqamli buyurtmangiz ushbu Telegramingizga biriktirildi. Holat o'zgarganda sizga xabar yuboriladi!`);
  }
  await sendOrderCard(chatId, order);
}

async function sendOrderCard(chatId, order) {
  const adminUser = isAdmin(chatId);
  const cardText = getOrderCardText(order);
  const inlineRows = getOrderInlineKeyboard(order, adminUser);

  const extra = {};
  if (inlineRows && inlineRows.length > 0) {
    extra.reply_markup = { inline_keyboard: inlineRows };
  }

  await sendMessage(chatId, cardText, {
    ...extra,
    ...getMainKeyboard(chatId),
  });

  // If order has coordinates, send native Telegram map pin!
  if (order.location?.lat && order.location?.lng) {
    await api('sendLocation', {
      chat_id: chatId,
      latitude: order.location.lat,
      longitude: order.location.lng,
    }).catch(() => {});
  }
}

// ─── Callback Query (Status & Rating Handler) ─────────────────
async function handleCallbackQuery(cq) {
  const data = cq.data || '';
  const chatId = cq.message?.chat?.id;
  const messageId = cq.message?.message_id;
  const userFirst = cq.from?.first_name || 'Mijoz';

  // 1. Check status prompt
  if (data === 'check_status') {
    userStates.set(chatId, 'WAITING_ORDER_SEARCH');
    await answerCallbackQuery(cq.id);
    const prompt = [
      `🔍 <b>Buyurtma holatini tekshirish:</b>`,
      '',
      `Iltimos, <b>telefon raqamingizni</b> yuboring yoki buyurtma berganingizda berilgan <b>ID raqamni</b> kiriting (masalan: <code>HG-261114-120</code>).`,
      '',
      `Pastdagi tugmalar orqali telefon yoki lokatsiyangizni ham yuborishingiz mumkin:`,
    ].join('\n');
    await sendMessage(chatId, prompt, REQUEST_CONTACT_KEYBOARD);
    return;
  }

  // 2. Status change by Admin: st:<status>:<orderId>
  if (data.startsWith('st:')) {
    const [, newStatus, orderId] = data.split(':');
    let orders = getOrders();
    let orderIdx = orders.findIndex(o => o.id === orderId);

    // If order not found locally, try fetching from Vercel remote API
    if (orderIdx === -1) {
      try {
        const res = await fetch('https://otash-qossob.vercel.app/api/orders');
        const remoteOrders = await res.json();
        if (Array.isArray(remoteOrders)) {
          for (const ro of remoteOrders) {
            if (!orders.some(lo => lo.id === ro.id)) orders.push(ro);
          }
          saveOrders(orders);
          orderIdx = orders.findIndex(o => o.id === orderId);
        }
      } catch {}
    }

    // If still not in database, reconstruct directly from Telegram message text!
    if (orderIdx === -1) {
      const msgText = cq.message?.text || '';
      const reconstructed = parseOrderFromMessage(msgText, orderId);
      reconstructed.status = newStatus;
      orders.unshift(reconstructed);
      saveOrders(orders);
      orderIdx = 0;
    }

    orders[orderIdx].status = newStatus;
    saveOrders(orders);
    const order = orders[orderIdx];
    const st = STATUS_LABELS[newStatus] || STATUS_LABELS.new;

    await answerCallbackQuery(cq.id, `✅ Holat: ${st.label}`, false);

    // Sync status back to Vercel API
    fetch('https://otash-qossob.vercel.app/api/orders/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, status: newStatus }),
    }).catch(() => {});

    // Edit message in current chat
    const updatedCardText = getOrderCardText(order);
    const adminUser = isAdmin(chatId);
    const inlineRows = getOrderInlineKeyboard(order, adminUser);

    if (chatId && messageId) {
      await editMessageText(chatId, messageId, updatedCardText, {
        reply_markup: inlineRows ? { inline_keyboard: inlineRows } : undefined,
      });
    }

    // Notify Customer if customer chatId exists and is not admin
    if (order.chatId && !isAdmin(order.chatId) && String(order.chatId) !== String(chatId)) {
      if (newStatus === 'confirmed') {
        await sendMessage(
          order.chatId,
          `✅ <b>Hurmatli ${order.customerName || 'mijoz'}!</b>\n\nSizning <code>#${order.id}</code> raqamli buyurtmangiz <b>qabul qilindi va tasdiqlandi</b>!`,
          getMainKeyboard(order.chatId)
        );
      } else if (newStatus === 'cooking') {
        await sendMessage(
          order.chatId,
          `👨‍🍳 <b>Hurmatli ${order.customerName || 'mijoz'}!</b>\n\nSizning <code>#${order.id}</code> raqamli go'sht buyurtmangiz <b>tayyorlanmoqda</b> (yangi go'sht saralanib, sifatli qadoqlanmoqda).`,
          getMainKeyboard(order.chatId)
        );
      } else if (newStatus === 'delivering') {
        await sendMessage(
          order.chatId,
          `🚗 <b>Hurmatli ${order.customerName || 'mijoz'}!</b>\n\nSizning <code>#${order.id}</code> raqamli go'sht buyurtmangiz kuryerga topshirildi va uyingiz tomon <b>yo'lga chiqdi</b>! Tez orada yetib boradi.`,
          getMainKeyboard(order.chatId)
        );
      } else if (newStatus === 'done') {
        const rateText = [
          `🎉 <b>Hurmatli ${order.customerName || 'mijoz'}!</b>`,
          '',
          `Sizning <b>#${order.id}</b> raqamli go'sht buyurtmangiz muvaffaqiyatli <b>yetkazib berildi</b>!`,
          '',
          `🥩 Go'sht sifati va yetkazish xizmatimiz sizga ma'qul bo'ldimi?`,
          `Iltimos, xizmatimizni baholang:`,
        ].join('\n');

        await sendMessage(order.chatId, rateText, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '⭐ 5 (A\'lo)', callback_data: `rate:5:${order.id}` },
                { text: '⭐ 4 (Yaxshi)', callback_data: `rate:4:${order.id}` },
              ],
              [
                { text: '⭐ 3 (O\'rtacha)', callback_data: `rate:3:${order.id}` },
                { text: '⭐ 2', callback_data: `rate:2:${order.id}` },
                { text: '⭐ 1', callback_data: `rate:1:${order.id}` },
              ],
            ],
          },
        });
      } else if (newStatus === 'cancelled') {
        await sendMessage(
          order.chatId,
          `❌ <b>Hurmatli ${order.customerName || 'mijoz'}!</b>\n\nSizning <code>#${order.id}</code> raqamli buyurtmangiz bekor qilindi.\nSavollar bo'yicha: +998 90 616 87 12`,
          getMainKeyboard(order.chatId)
        );
      }
    }
    return;
  }

  // 3. Rating by Customer: rate:<stars>:<orderId>
  if (data.startsWith('rate:')) {
    const [, starStr, orderId] = data.split(':');
    const stars = parseInt(starStr, 10) || 5;

    // Update order in orders.json
    const orders = getOrders();
    const orderIdx = orders.findIndex(o => o.id === orderId);
    let orderName = userFirst;
    if (orderIdx !== -1) {
      orders[orderIdx].rated = true;
      orders[orderIdx].rating = stars;
      orderName = orders[orderIdx].customerName || userFirst;
      saveOrders(orders);
    }

    // Add to reviews.json
    const reviews = getReviews();
    const newRev = {
      id: Date.now().toString(),
      targetType: 'service',
      targetId: 'service',
      targetName: 'Yetkazib berish xizmati',
      userName: orderName,
      rating: stars,
      comment: `Telegram bot orqali baholandi (#${orderId})`,
      createdAt: new Date().toISOString(),
    };
    reviews.unshift(newRev);
    saveReviews(reviews);

    await answerCallbackQuery(cq.id, `Rahmat! ${stars} ⭐ bahongiz qabul qilindi!`, true);

    const thanksText = [
      `✅ <b>Bahoyingiz qabul qilindi! Katta rahmat!</b>`,
      '',
      `Siz buyurtmangizga <b>${stars} ⭐ (${'★'.repeat(stars)})</b> baho berdingiz.`,
      `Sizga sifatli va halol go'sht yetkazib berganimizdan mamnunmiz! Yoqimli ishtaha! 🥩✨`,
    ].join('\n');

    if (chatId && messageId) {
      await editMessageText(chatId, messageId, thanksText);
    }

    // Notify all Admins
    for (const adminId of ADMIN_IDS) {
      const adminNotice = [
        `⭐ <b>YANGI BAHO QABUL QILINDI!</b>`,
        '',
        `👤 <b>Mijoz:</b> ${orderName}`,
        `📦 <b>Buyurtma ID:</b> <code>${orderId}</code>`,
        `⭐️ <b>Baho:</b> ${'★'.repeat(stars)} (${stars}/5)`,
        `💬 <i>Mijoz bot orqali xizmatni baholadi.</i>`,
      ].join('\n');
      await sendMessage(adminId, adminNotice);
    }
  }
}

// ─── Long Polling Loop ───────────────────────────────────────
let offset = 0;
let isRunning = true;

async function poll() {
  console.log(`🤖 Halol Go'sht Telegram Bot ishga tushdi! (@halolgoshtyetkazishbot)`);

  while (isRunning) {
    try {
      const res = await api('getUpdates', {
        offset,
        timeout: 25,
        allowed_updates: ['message', 'callback_query'],
      });

      if (res && res.ok && Array.isArray(res.result)) {
        for (const update of res.result) {
          offset = update.update_id + 1;

          if (update.message) {
            await handleMessage(update.message);
          } else if (update.callback_query) {
            await handleCallbackQuery(update.callback_query);
          }
        }
      }
    } catch (err) {
      console.error('Polling error:', err.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

poll();
