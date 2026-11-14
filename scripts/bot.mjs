import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const ORDERS_FILE = path.join(ROOT, 'data', 'orders.json');
const REVIEWS_FILE = path.join(ROOT, 'data', 'reviews.json');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9057174699:AAFZXhyddBXk4pf-caIjev1W4nd5sg0K2_U';
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6985755311';
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
  cooking: { label: 'Tayyorlanmoqda', emoji: '👨‍🍳', desc: 'Sifatli go\'sht kesilib, qadoqlanmoqda' },
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
const MAIN_KEYBOARD = {
  reply_markup: {
    keyboard: [
      [{ text: '📦 Buyurtmam holati' }, { text: '🥩 Mahsulotlar narxi' }],
      [{ text: '🛒 Do\'konga kirish (Sayt)' }, { text: '📞 Aloqa va Manzil' }],
    ],
    resize_keyboard: true,
  },
};

const REQUEST_CONTACT_KEYBOARD = {
  reply_markup: {
    keyboard: [
      [{ text: '📱 Telefon raqamimni yuborish', request_contact: true }],
      [{ text: '🔙 Bosh menyu' }],
    ],
    resize_keyboard: true,
  },
};

// User interaction state (e.g. waiting for order id)
const userStates = new Map();

// ─── Message Handlers ────────────────────────────────────────
async function handleMessage(msg) {
  const chatId = msg.chat?.id;
  const text = msg.text?.trim();
  const userName = msg.from?.first_name || 'Mijoz';

  if (!chatId) return;

  // Contact shared
  if (msg.contact?.phone_number) {
    const rawPhone = msg.contact.phone_number.replace(/\D/g, '');
    await showOrderByPhone(chatId, rawPhone, userName);
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

    const welcome = [
      `🥩 <b>Assalomu alaykum, ${userName}!</b>`,
      '',
      `<b>"Halol Go'sht"</b> rasmiy yetkazib berish xizmati botiga xush kelibsiz!`,
      '',
      `Bu yerda siz:`,
      `• 🥩 Yangi va halol go'sht turlari narxini ko'rishingiz`,
      `• 📦 Buyurtmangiz tarkibi va <b>holatini (status)</b> kuzatishingiz`,
      `• ⭐ Yetkazib berilgach, sifat va xizmatimizni <b>baholashingiz</b> mumkin!`,
      '',
      `Quyidagi tugmalardan birini tanlang:`,
    ].join('\n');

    await sendMessage(chatId, welcome, MAIN_KEYBOARD);
    return;
  }

  // 1. Buyurtma holati
  if (lower.includes('buyurtma') || lower === '/buyurtma') {
    userStates.set(chatId, 'WAITING_ORDER_SEARCH');
    const prompt = [
      `🔍 <b>Buyurtma holatini tekshirish:</b>`,
      '',
      `Iltimos, <b>telefon raqamingizni</b> yuboring yoki buyurtma berganingizda berilgan <b>ID raqamni</b> kiriting (masalan: <code>HG-20261114-102</code>).`,
      '',
      `Pastdagi <b>"📱 Telefon raqamimni yuborish"</b> tugmasini bosishingiz ham mumkin:`,
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

    const extra = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📞 Buyurtma berish (@Otabek07092000)', url: 'https://t.me/Otabek07092000' }],
          [{ text: '📦 Buyurtmam holatini tekshirish', callback_data: 'check_status' }],
        ],
      },
    };

    await sendMessage(chatId, productsText, extra);
    return;
  }

  // 3. Do'konga kirish (Sayt)
  if (lower.includes('do\'kon') || lower.includes('sayt') || lower === '/sayt') {
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
          [{ text: '✈️ Administrator bilan bog\'lanish', url: 'https://t.me/Otabek07092000' }],
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
    MAIN_KEYBOARD
  );
}

// ─── Order Search Helpers ────────────────────────────────────
async function showOrderByIdOrPhone(chatId, query, userName) {
  const orders = getOrders();
  const cleanQ = query.replace(/\D/g, '');

  // Match by order ID or phone
  const matched = orders.filter(o => {
    if (o.id && o.id.toLowerCase() === query.toLowerCase()) return true;
    if (cleanQ && o.phone && o.phone.replace(/\D/g, '').includes(cleanQ)) return true;
    return false;
  });

  if (matched.length === 0) {
    await sendMessage(
      chatId,
      `❌ <b>Buyurtma topilmadi.</b>\n\nKiritilgan ma'lumot: <code>${query}</code>\nIltimos, buyurtma ID raqami yoki buyurtma bergan telefoningizni to'g'ri kiriting.`,
      MAIN_KEYBOARD
    );
    return;
  }

  // Show latest matched order and link chatId
  const order = matched[0];
  if (order.chatId !== chatId) {
    order.chatId = chatId;
    saveOrders(orders);
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
      MAIN_KEYBOARD
    );
    return;
  }

  const order = matched[0];
  if (order.chatId !== chatId) {
    order.chatId = chatId;
    saveOrders(orders);
  }
  await sendOrderCard(chatId, order);
}

async function sendOrderCard(chatId, order) {
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
    `💳 <b>To'lov:</b> ${order.paymentType === 'cash' ? 'Naqd pul' : 'Karta'}`,
    '',
    `🥩 <b>Tanlangan mahsulotlar:</b>`,
    itemsText || '  • Go\'sht mahsulotlari',
    '',
    order.deliveryPrice ? `🚗 <b>Yetkazib berish:</b> ${fmt(order.deliveryPrice)} so'm` : '',
    `💰 <b>JAMI SUMMA:</b> <b>${fmt(order.totalPrice + (order.deliveryPrice || 0))} so'm</b>`,
  ].filter(Boolean);

  const extra = {};

  // If order is done (yetkazildi), provide interactive star rating buttons!
  if (order.status === 'done' && !order.rated) {
    lines.push('');
    lines.push('🎉 <b>Buyurtmangiz yetkazildi!</b>');
    lines.push('Iltimos, go\'sht sifati va yetkazish xizmatimizni baholang:');

    extra.reply_markup = {
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
    };
  } else if (order.rated) {
    lines.push('');
    lines.push(`⭐ <b>Baho berilgan:</b> ${'★'.repeat(order.rating || 5)} (${order.rating || 5}/5) — Rahmat!`);
  }

  await sendMessage(chatId, lines.join('\n'), {
    ...extra,
    ...MAIN_KEYBOARD,
  });
}

// ─── Callback Query (Yulduzcha bosilganda) ─────────────────────
async function handleCallbackQuery(cq) {
  const data = cq.data || '';
  const chatId = cq.message?.chat?.id;
  const messageId = cq.message?.message_id;
  const userFirst = cq.from?.first_name || 'Mijoz';

  if (data === 'check_status') {
    userStates.set(chatId, 'WAITING_ORDER_SEARCH');
    await answerCallbackQuery(cq.id);
    const prompt = [
      `🔍 <b>Buyurtma holatini tekshirish:</b>`,
      '',
      `Iltimos, <b>telefon raqamingizni</b> yuboring yoki buyurtma berganingizda berilgan <b>ID raqamni</b> kiriting (masalan: <code>HG-20261114-102</code>).`,
      '',
      `Pastdagi <b>"📱 Telefon raqamimni yuborish"</b> tugmasini bosishingiz ham mumkin:`,
    ].join('\n');
    await sendMessage(chatId, prompt, REQUEST_CONTACT_KEYBOARD);
    return;
  }

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

    // Notify Admin
    if (ADMIN_CHAT_ID) {
      const adminNotice = [
        `⭐ <b>YANGI BAHO QABUL QILINDI!</b>`,
        '',
        `👤 <b>Mijoz:</b> ${orderName}`,
        `📦 <b>Buyurtma ID:</b> <code>${orderId}</code>`,
        `⭐️ <b>Baho:</b> ${'★'.repeat(stars)} (${stars}/5)`,
        `💬 <i>Mijoz bot orqali muvaffaqiyatli baholadi.</i>`,
      ].join('\n');
      await sendMessage(ADMIN_CHAT_ID, adminNotice);
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
