import { NextResponse } from 'next/server';
import { readOrders, writeOrders, readReviews, writeReviews } from '../../../lib/db';

export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9057174699:AAFZXhyddBXk4pf-caIjev1W4nd5sg0K2_U';
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

export async function POST(req: Request) {
  try {
    const update = await req.json();

    // ─── Callback query handler (Admin status buttons & rating) ───
    if (update.callback_query) {
      const cq = update.callback_query;
      const data = cq.data || '';
      const chatId = cq.message?.chat?.id;
      const messageId = cq.message?.message_id;

      if (data.startsWith('st:')) {
        const [, newStatus, orderId] = data.split(':');
        const orders = readOrders();
        let orderIdx = orders.findIndex((o: any) => o.id === orderId);

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

        // Answer callback query popup
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: cq.id,
            text: `✅ Holat: ${st.label}`,
          }),
        }).catch(() => {});

        // Edit message in Telegram
        if (chatId && messageId) {
          const inline_keyboard: any[] = [
            [
              { text: '✅ Qabul qilish', callback_data: `st:confirmed:${order.id}` },
              { text: '👨‍🍳 Tayyorlash', callback_data: `st:cooking:${order.id}` },
            ],
            [
              { text: '🚗 Kuryer yo\'lda', callback_data: `st:delivering:${order.id}` },
              { text: '✓ Yetkazildi', callback_data: `st:done:${order.id}` },
            ],
          ];
          if (order.location?.mapsLink) {
            inline_keyboard.push([{ text: '📍 Xaritada ko\'rish 🗺️', url: order.location.mapsLink }]);
          }

          const originalText = cq.message?.text || '';
          const updatedText = originalText.includes('📊 Holati:')
            ? originalText.replace(/📊 Holati:[^\n]+/, `📊 Holati: ${st.emoji} ${st.label}`)
            : `📊 <b>Holati:</b> ${st.emoji} <b>${st.label}</b>\n\n${originalText}`;

          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: messageId,
              text: updatedText,
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard },
            }),
          }).catch(() => {});
        }

        // Notify customer if customer Telegram is attached and not admin
        if (order.chatId && !isAdmin(order.chatId)) {
          let customerMsg = '';
          if (newStatus === 'confirmed') {
            customerMsg = `✅ <b>Hurmatli ${order.customerName || 'Mijoz'}!</b>\n\nSizning <code>#${order.id}</code> raqamli buyurtmangiz <b>tasdiqlandi</b>!`;
          } else if (newStatus === 'delivering') {
            customerMsg = `🚗 <b>Hurmatli ${order.customerName || 'Mijoz'}!</b>\n\nSizning <code>#${order.id}</code> raqamli go'sht buyurtmangiz kuryerga topshirildi va uyingiz tomon <b>yo'lga chiqdi</b>! Tez orada yetib boradi.`;
          } else if (newStatus === 'done') {
            customerMsg = `🎉 <b>Hurmatli ${order.customerName || 'Mijoz'}!</b>\n\nSizning <code>#${order.id}</code> raqamli buyurtmangiz yetkazib berildi! Go'sht sifati va yetkazish xizmatimiz sizga ma'qul bo'ldimi?`;
          }

          if (customerMsg) {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: order.chatId,
                text: customerMsg,
                parse_mode: 'HTML',
              }),
            }).catch(() => {});
          }
        }
      }

      // Rating handler
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

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: cq.id,
            text: `Rahmat! ${numStars} yulduz bilan baholandi ⭐`,
          }),
        }).catch(() => {});
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
