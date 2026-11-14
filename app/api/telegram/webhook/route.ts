import { NextResponse } from 'next/server';
import { readOrders, writeOrders, readReviews, writeReviews } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'Halol Gosht Telegram Webhook',
    status: 'online',
    admins: ADMIN_IDS,
    timestamp: new Date().toISOString(),
  });
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9057174699:AAFZXhyddBXk4pf-caIjev1W4nd5sg0K2_U';
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

const DEFAULT_ADMIN_IDS = ['6985755311', '8774620555'];
const envAdmins = process.env.TELEGRAM_CHAT_ID
  ? process.env.TELEGRAM_CHAT_ID.split(',').map(s => s.trim()).filter(Boolean)
  : [];
const ADMIN_IDS = Array.from(new Set([...DEFAULT_ADMIN_IDS, ...envAdmins]));
const isAdmin = (chatId: any) => ADMIN_IDS.map(String).includes(String(chatId));

const STATUS_LABELS: Record<string, { label: string; emoji: string; desc: string }> = {
  new: { label: 'Yangi qabul qilindi', emoji: '🆕', desc: 'Operator tomonidan tekshirilmoqda' },
  confirmed: { label: 'Tasdiqlandi', emoji: '✅', desc: 'Buyurtmangiz qabul qilindi' },
  cooking: { label: 'Tayyorlanmoqda', emoji: '👨‍🍳', desc: 'Sifatli go\'sht saralanib, qadoqlanmoqda' },
  delivering: { label: 'Yetkazilmoqda (Yo\'lda)', emoji: '🚗', desc: 'Kuryerimiz uyingiz tomon yo\'lda' },
  done: { label: 'Yetkazib berildi', emoji: '✓', desc: 'Buyurtma muvaffaqiyatli topshirildi' },
  cancelled: { label: 'Bekor qilingan', emoji: '❌', desc: 'Buyurtma bekor qilingan' },
};

const fmt = (n: number) => Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// ─── Telegram API Helper ────────────────────────────────────
async function api(method: string, body: any = {}) {
  try {
    const res = await fetch(`${BASE_URL}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err: any) {
    console.error(`Telegram API error on ${method}:`, err.message);
    return null;
  }
}

async function sendMessage(chatId: any, text: string, extra: any = {}) {
  return await api('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...extra,
  });
}

// ─── Keyboards ──────────────────────────────────────────────
function getMainKeyboard(chatId: any) {
  const adminUser = isAdmin(chatId);
  const rows: any[] = [
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

function matchPhone(phoneA: any, phoneB: any) {
  if (!phoneA || !phoneB) return false;
  const digitsA = String(phoneA).replace(/\D/g, '');
  const digitsB = String(phoneB).replace(/\D/g, '');
  if (!digitsA || !digitsB) return false;
  if (digitsA === digitsB) return true;
  const last9A = digitsA.slice(-9);
  const last9B = digitsB.slice(-9);
  if (last9A.length === 9 && last9B.length === 9 && last9A === last9B) return true;
  return digitsA.includes(digitsB) || digitsB.includes(digitsA);
}

function parseOrderFromMessage(text: string, orderId: string) {
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
    deliveryType: 'delivery' as const,
    deliveryZone: 'samarqand' as const,
    paymentType: payMatch && payMatch[1].toLowerCase().includes('karta') ? 'card' as const : 'cash' as const,
    note: noteMatch ? noteMatch[1].trim() : '',
    totalPrice: cleanTotal,
    deliveryPrice: 0,
    status: 'new' as const,
    createdAt: new Date().toISOString(),
    items: [],
  };
}

function getOrderCardText(order: any) {
  const st = STATUS_LABELS[order.status] || STATUS_LABELS.new;

  let itemsText = '';
  if (Array.isArray(order.items)) {
    itemsText = order.items
      .map((i: any) => {
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
    `💰 <b>JAMI SUMMA:</b> <b>${fmt((order.totalPrice || 0) + (order.deliveryPrice || 0))} so'm</b>`,
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

function getOrderInlineKeyboard(order: any, adminUser: boolean) {
  if (adminUser) {
    const rows: any[] = [
      [
        { text: '✅ Qabul qilish', callback_data: `st:confirmed:${order.id}` },
        { text: '👨‍🍳 Tayyorlash', callback_data: `st:cooking:${order.id}` },
      ],
      [
        { text: '🚗 Kuryer yo\'lda', callback_data: `st:delivering:${order.id}` },
        { text: '✓ Yetkazildi', callback_data: `st:done:${order.id}` },
      ],
    ];
    const subRow: any[] = [];
    if (order.location?.mapsLink) {
      subRow.push({ text: '📍 Xarita 🗺️', url: order.location.mapsLink });
    }
    subRow.push({ text: '❌ Bekor qilish', callback_data: `st:cancelled:${order.id}` });
    rows.push(subRow);
    return rows;
  }

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

async function sendOrderCard(chatId: any, order: any) {
  const adminUser = isAdmin(chatId);
  const cardText = getOrderCardText(order);
  const inlineRows = getOrderInlineKeyboard(order, adminUser);

  const extra: any = {};
  if (inlineRows && inlineRows.length > 0) {
    extra.reply_markup = { inline_keyboard: inlineRows };
  }

  await sendMessage(chatId, cardText, {
    ...extra,
    ...getMainKeyboard(chatId),
  });

  if (order.location?.lat && order.location?.lng) {
    await api('sendLocation', {
      chat_id: chatId,
      latitude: order.location.lat,
      longitude: order.location.lng,
    }).catch(() => {});
  }
}

// ─── Webhook Asosiy Handler ───────────────────────────────────
export async function POST(req: Request) {
  try {
    const update = await req.json();

    // ─── 1. Callback query handler (Admin status tugmalari, Rating, Qidiruv) ───
    if (update.callback_query) {
      const cq = update.callback_query;
      const data = cq.data || '';
      const chatId = cq.message?.chat?.id;
      const messageId = cq.message?.message_id;

      // Status tekshirish tugmasi
      if (data === 'check_status') {
        await api('answerCallbackQuery', { callback_query_id: cq.id });
        const orders = readOrders();
        const userOrders = orders.filter((o: any) => String(o.chatId) === String(chatId));
        if (userOrders.length > 0) {
          const activeOrder = userOrders.find((o: any) => o.status !== 'done' && o.status !== 'cancelled') || userOrders[0];
          await sendMessage(chatId, `📦 <b>Sizning buyurtmangiz:</b>`);
          await sendOrderCard(chatId, activeOrder);
          return NextResponse.json({ ok: true });
        }

        const prompt = [
          `🔍 <b>Buyurtma holatini tekshirish:</b>`,
          '',
          `Iltimos, telefon raqamingizni yoki buyurtma berganingizda berilgan ID raqamni (masalan: <code>HG-261114-120</code>) yozib yuboring:`,
        ].join('\n');
        await sendMessage(chatId, prompt, REQUEST_CONTACT_KEYBOARD);
        return NextResponse.json({ ok: true });
      }

      // Status o'zgartirish: st:<status>:<orderId>
      if (data.startsWith('st:')) {
        const [, newStatus, orderId] = data.split(':');
        const orders = readOrders();
        let orderIdx = orders.findIndex((o: any) => o.id === orderId);

        // Agar allaqachon shu holatda bo'lsa, qayta yuborilmaydi
        if (orderIdx !== -1 && orders[orderIdx].status === newStatus) {
          const st = STATUS_LABELS[newStatus] || STATUS_LABELS.new;
          await api('answerCallbackQuery', {
            callback_query_id: cq.id,
            text: `Holat allaqachon: ${st.label}`,
          });
          return NextResponse.json({ ok: true });
        }

        // Agar topilmasa, xabar matnidan o'qib tiklash
        if (orderIdx === -1) {
          const msgText = cq.message?.text || '';
          const reconstructed = parseOrderFromMessage(msgText, orderId);
          reconstructed.status = newStatus as any;
          orders.unshift(reconstructed);
          writeOrders(orders);
          orderIdx = 0;
        } else {
          orders[orderIdx].status = newStatus;
          writeOrders(orders);
        }

        const order = orders[orderIdx];
        const st = STATUS_LABELS[newStatus] || STATUS_LABELS.new;

        await api('answerCallbackQuery', {
          callback_query_id: cq.id,
          text: `✅ Holat: ${st.label}`,
        });

        // Xabarni yangilash
        const updatedCardText = getOrderCardText(order);
        const adminUser = isAdmin(chatId);
        const inlineRows = getOrderInlineKeyboard(order, adminUser);

        if (chatId && messageId) {
          await api('editMessageText', {
            chat_id: chatId,
            message_id: messageId,
            text: updatedCardText,
            parse_mode: 'HTML',
            reply_markup: inlineRows ? { inline_keyboard: inlineRows } : undefined,
          });
        }

        // Mijozga bitta toza bildirishnoma
        if (order.chatId && !isAdmin(order.chatId) && String(order.chatId) !== String(chatId)) {
          let customerMsg = '';
          if (newStatus === 'confirmed') {
            customerMsg = `✅ <b>Hurmatli ${order.customerName || 'Mijoz'}!</b>\n\nSizning <code>#${order.id}</code> raqamli buyurtmangiz <b>tasdiqlandi</b>!`;
          } else if (newStatus === 'cooking') {
            customerMsg = `👨‍🍳 <b>Hurmatli ${order.customerName || 'Mijoz'}!</b>\n\nSizning <code>#${order.id}</code> raqamli go'sht buyurtmangiz <b>tayyorlanmoqda</b>.`;
          } else if (newStatus === 'delivering') {
            customerMsg = `🚗 <b>Hurmatli ${order.customerName || 'Mijoz'}!</b>\n\nSizning <code>#${order.id}</code> raqamli go'sht buyurtmangiz kuryerga topshirildi va uyingiz tomon <b>yo'lga chiqdi</b>! Tez orada yetib boradi.`;
          } else if (newStatus === 'done') {
            customerMsg = `🎉 <b>Hurmatli ${order.customerName || 'Mijoz'}!</b>\n\nSizning <code>#${order.id}</code> raqamli buyurtmangiz muvaffaqiyatli yetkazib berildi! Go'sht sifati va yetkazish xizmatimiz sizga ma'qul bo'ldimi?`;
          }

          if (customerMsg) {
            await sendMessage(order.chatId, customerMsg, getMainKeyboard(order.chatId));
          }
        }
        return NextResponse.json({ ok: true });
      }

      // Baholash (Rating)
      if (data.startsWith('rate:')) {
        const [, stars, orderId] = data.split(':');
        const numStars = parseInt(stars, 10) || 5;
        const orders = readOrders();
        const ord = orders.find((o: any) => o.id === orderId);
        if (ord) {
          ord.rated = true;
          ord.rating = numStars;
          writeOrders(orders);
        }

        const reviews = readReviews();
        reviews.unshift({
          id: Date.now().toString(),
          targetType: 'service',
          targetId: 'service',
          targetName: 'Yetkazib berish xizmati',
          userName: ord?.customerName || 'Mijoz',
          rating: numStars,
          comment: `Telegram orqali ${numStars} yulduz baholandi`,
          createdAt: new Date().toISOString(),
        });
        writeReviews(reviews);

        await api('answerCallbackQuery', {
          callback_query_id: cq.id,
          text: `Rahmat! ${numStars} yulduz bilan baholandi ⭐`,
        });

        if (chatId && messageId) {
          await api('editMessageText', {
            chat_id: chatId,
            message_id: messageId,
            text: `⭐ <b>Baho berildi: ${'★'.repeat(numStars)} (${numStars}/5)</b>\n\nXizmatimizni baholaganingiz uchun tashakkur!`,
            parse_mode: 'HTML',
          });
        }

        // Adminlarga xabar
        for (const adminId of ADMIN_IDS) {
          const adminNotice = [
            `⭐ <b>YANGI BAHO QABUL QILINDI!</b>`,
            '',
            `👤 <b>Mijoz:</b> ${ord?.customerName || 'Mijoz'}`,
            `📦 <b>Buyurtma ID:</b> <code>${orderId}</code>`,
            `⭐️ <b>Baho:</b> ${'★'.repeat(numStars)} (${numStars}/5)`,
          ].join('\n');
          await sendMessage(adminId, adminNotice);
        }
        return NextResponse.json({ ok: true });
      }
    }

    // ─── 2. Matnli xabarlar va menyu buyruqlari ───
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat?.id;
      const text = (msg.text || '').trim();
      const lower = text.toLowerCase();
      const userName = msg.from?.first_name || 'Mijoz';

      if (!chatId) return NextResponse.json({ ok: true });

      // 1. Kontakt yuborilganda
      if (msg.contact?.phone_number) {
        const cleanPhone = msg.contact.phone_number.replace(/\D/g, '');
        const orders = readOrders();
        const matched = orders.filter((o: any) => matchPhone(o.phone, cleanPhone));
        if (matched.length > 0) {
          const ord = matched[0];
          if (String(ord.chatId) !== String(chatId) && !isAdmin(chatId)) {
            ord.chatId = chatId;
            writeOrders(orders);
          }
          await sendMessage(chatId, `✅ <b>#${ord.id}</b> raqamli buyurtmangiz Telegramingizga biriktirildi!`);
          await sendOrderCard(chatId, ord);
        } else {
          await sendMessage(
            chatId,
            `❌ Ushbu <b>+${cleanPhone}</b> raqamiga tegishli buyurtma topilmadi.\n\nAgar saytda boshqa raqam bilan buyurtma bergan bo'lsangiz, buyurtma ID raqamini (masalan: <code>HG-261114-120</code>) yozib yuboring.`,
            getMainKeyboard(chatId)
          );
        }
        return NextResponse.json({ ok: true });
      }

      // 2. Lokatsiya yuborilganda
      if (msg.location) {
        const { latitude, longitude } = msg.location;
        const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
        const orders = readOrders();
        const userOrder = orders.find(
          (o: any) => (String(o.chatId) === String(chatId) || (msg.from?.id && String(o.chatId) === String(msg.from.id))) &&
               o.status !== 'done' && o.status !== 'cancelled'
        ) || orders[0];

        if (userOrder) {
          userOrder.location = { lat: latitude, lng: longitude, mapsLink };
          if (!userOrder.chatId) userOrder.chatId = chatId;
          writeOrders(orders);

          await sendMessage(
            chatId,
            `📍 <b>Lokatsiyangiz qabul qilindi va buyurtmaga biriktirildi!</b>\n\n📦 <b>Buyurtma ID:</b> <code>#${userOrder.id}</code>\n🔗 <a href="${mapsLink}">Google Xaritada ko'rish 🗺️</a>\n\nKuryerimiz ushbu manzil bo'yicha yetkazib beradi!`,
            getMainKeyboard(chatId)
          );

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
        return NextResponse.json({ ok: true });
      }

      // 3. /start yoki bosh menyu
      if (lower.startsWith('/start') || lower.includes('bosh menyu') || lower === 'menyu') {
        const parts = text.split(' ');
        if (parts.length > 1 && parts[1].trim()) {
          const orderArg = parts[1].trim();
          const orders = readOrders();
          const matched = orders.filter((o: any) => o.id && o.id.toLowerCase() === orderArg.toLowerCase());
          if (matched.length > 0) {
            const ord = matched[0];
            if (String(ord.chatId) !== String(chatId) && !isAdmin(chatId)) {
              ord.chatId = chatId;
              writeOrders(orders);
            }
            await sendMessage(chatId, `✅ <b>#${ord.id}</b> raqamli buyurtmangiz Telegramingizga biriktirildi!`);
            await sendOrderCard(chatId, ord);
            return NextResponse.json({ ok: true });
          }
        }

        const adminUser = isAdmin(chatId);
        const welcome = [
          `🥩 <b>Assalomu alaykum, ${userName}!</b>`,
          '',
          `<b>"Halol Go'sht"</b> rasmiy yetkazib berish xizmati botiga xush kelibsiz!`,
          '',
          `Bu yerda siz:`,
          `• 🥩 Yangi va halol go'sht turlari narxini ko'rishingiz`,
          `• 📦 Buyurtmangiz tarkibi, <b>GPS lokatsiyasi</b> va <b>holatini</b> kuzatishingiz`,
          `• ⭐ Yetkazib berilgach, xizmatimizni <b>baholashingiz</b> mumkin!`,
          adminUser ? '\n👨‍💼 <i>Siz tizimda Administrator sifatida tanildingiz. Barcha buyurtmalarni boshqarishingiz mumkin.</i>' : '',
          '',
          `Quyidagi tugmalardan birini tanlang:`,
        ].filter(Boolean).join('\n');

        await sendMessage(chatId, welcome, getMainKeyboard(chatId));
        return NextResponse.json({ ok: true });
      }

      // 4. Admin buyurtmalar ro'yxati
      if (lower.includes('barcha buyurtmalar') || lower === '/orders' || lower === '/admin') {
        const orders = readOrders();
        if (orders.length === 0) {
          await sendMessage(chatId, `📭 Hozircha buyurtmalar yo'q.`, getMainKeyboard(chatId));
          return NextResponse.json({ ok: true });
        }
        const recent = orders.slice(0, 5);
        await sendMessage(chatId, `📋 <b>Oxirgi ${recent.length} ta buyurtmalar:</b>`);
        for (const ord of recent) {
          await sendOrderCard(chatId, ord);
        }
        return NextResponse.json({ ok: true });
      }

      // 5. Buyurtmam holati
      if (lower.includes('buyurtma') || lower === '/buyurtma') {
        const orders = readOrders();
        const userOrders = orders.filter((o: any) => String(o.chatId) === String(chatId));
        if (userOrders.length > 0) {
          const activeOrder = userOrders.find((o: any) => o.status !== 'done' && o.status !== 'cancelled') || userOrders[0];
          await sendMessage(chatId, `📦 <b>Sizning buyurtmangiz holati:</b>`);
          await sendOrderCard(chatId, activeOrder);
          return NextResponse.json({ ok: true });
        }

        const prompt = [
          `🔍 <b>Buyurtma holatini tekshirish:</b>`,
          '',
          `Iltimos, telefon raqamingizni yoki buyurtma ID raqamini (masalan: <code>HG-261114-120</code>) yozib yuboring:`,
        ].join('\n');
        await sendMessage(chatId, prompt, REQUEST_CONTACT_KEYBOARD);
        return NextResponse.json({ ok: true });
      }

      // 6. Mahsulotlar narxi
      if (lower.includes('narx') || lower.includes('mahsulot') || lower.includes('go\'sht') || lower === '/mahsulotlar') {
        const siteUrl = `https://otash-qossob.vercel.app?tg_chat_id=${chatId}`;
        const productsText = [
          `🥩 <b>"HALOL GO'SHT" MAHSULOTLARI VA NARXLARI:</b>`,
          '',
          `1. 🐄 <b>Mol go'shti:</b> 130 000 so'm / kg`,
          `2. 🐑 <b>Qo'y go'shti:</b> 150 000 so'm / kg`,
          `3. 🐔 <b>Tovuq go'shti:</b> 100 000 so'm / kg`,
          `4. 🥩 <b>Qiyma:</b> 160 000 so'm / kg`,
          `5. 🍖 <b>Kaboblik go'sht:</b> 150 000 so'm / kg`,
          `6. 🦴 <b>Suyakli go'sht:</b> 79 995 so'm / kg`,
          '',
          `🚗 <b>Yetkazib berish:</b> 30–60 daqiqa`,
          `⏰ <b>Ish vaqti:</b> Har kuni 07:00 – 22:00`,
          `📞 <b>Telefon:</b> +998 90 616 87 12`,
        ].join('\n');

        await sendMessage(chatId, productsText, {
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
        });
        return NextResponse.json({ ok: true });
      }

      // 7. Do'konga kirish (Sayt)
      if (lower.includes('do\'kon') || lower.includes('sayt') || lower === '/sayt') {
        const siteUrl = `https://otash-qossob.vercel.app?tg_chat_id=${chatId}`;
        const siteMsg = [
          `🌐 <b>Halol Go'sht onlayn do'koni</b>`,
          '',
          `Saytimiz orqali go'sht turlarini va aniq vaznini tanlab buyurtma bering!`,
          `Shuningdek, aniq GPS lokatsiyangizni ham xaritadan yuborishingiz mumkin.`,
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
        return NextResponse.json({ ok: true });
      }

      // 8. Aloqa va Manzil
      if (lower.includes('aloqa') || lower.includes('manzil') || lower.includes('telefon') || lower === '/aloqa') {
        const contactMsg = [
          `🥩 <b>"Halol Go'sht" — Samarqand va Urgut</b>`,
          '',
          `📞 <b>Telefon:</b> +998 90 616 87 12`,
          `✈️ <b>Telegram aloqa:</b> @Otabek07092000`,
          `🤖 <b>Telegram bot:</b> @halolgoshtyetkazishbot`,
          `📍 <b>Manzil:</b> Samarqand sh., Urgut tumani`,
          `⏰ <b>Ish vaqti:</b> Har kuni 07:00 – 22:00`,
        ].join('\n');

        await sendMessage(chatId, contactMsg, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '✈️ Telegram orqali yozish (@Otabek07092000)', url: 'https://t.me/Otabek07092000' }],
            ],
          },
        });
        return NextResponse.json({ ok: true });
      }

      // 9. Telefon yoki ID qidirish
      const cleanDigits = text.replace(/\D/g, '');
      const isOrderOrPhone = text.toUpperCase().includes('HG-') || cleanDigits.length >= 7;

      if (isOrderOrPhone) {
        const cleanQ = text.replace('#', '').trim();
        const orders = readOrders();
        const matched = orders.filter((o: any) => {
          if (o.id && o.id.toLowerCase() === cleanQ.toLowerCase()) return true;
          if (o.id && o.id.replace('#', '').toLowerCase() === cleanQ.replace('#', '').toLowerCase()) return true;
          if (matchPhone(o.phone, cleanQ)) return true;
          return false;
        });

        if (matched.length > 0) {
          const ord = matched[0];
          if (String(ord.chatId) !== String(chatId) && !isAdmin(chatId)) {
            ord.chatId = chatId;
            writeOrders(orders);
          }
          await sendMessage(chatId, `✅ <b>#${ord.id}</b> raqamli buyurtmangiz Telegramingizga biriktirildi!`);
          await sendOrderCard(chatId, ord);
        } else {
          await sendMessage(
            chatId,
            `❌ <b>Buyurtma topilmadi.</b>\n\nKiritilgan ma'lumot: <code>${text}</code>\nIltimos, buyurtma ID raqami (masalan: <code>HG-261114-120</code>) yoki telefoningizni to'g'ri kiriting.`,
            getMainKeyboard(chatId)
          );
        }
        return NextResponse.json({ ok: true });
      }

      // Noma'lum buyruq
      await sendMessage(
        chatId,
        `Tushunarsiz buyruq. Iltimos, menyu tugmalaridan birini tanlang:`,
        getMainKeyboard(chatId)
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
