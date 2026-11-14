import { NextResponse } from 'next/server';
import { readOrders, writeOrders } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { orderId, status } = await req.json();
    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status required' }, { status: 400 });
    }

    let orders = readOrders();

    const idx = orders.findIndex((o: any) => o.id === orderId);
    if (idx !== -1) {
      orders[idx].status = status;
      writeOrders(orders);

      const order = orders[idx];
      const botToken = process.env.TELEGRAM_BOT_TOKEN || '9057174699:AAFZXhyddBXk4pf-caIjev1W4nd5sg0K2_U';
      const targetChatId = order.chatId;
      const adminChatId = process.env.TELEGRAM_CHAT_ID || '6985755311';

      // Faqat mijozning o'ziga yuboriladi (adminga mijoz xabarlarini tashlamaydi!)
      if (targetChatId && String(targetChatId) !== String(adminChatId) && botToken) {
        if (status === 'done') {
          const rateText = [
            `🎉 <b>Hurmatli ${order.customerName || 'mijoz'}!</b>`,
            '',
            `Sizning <b>#${order.id}</b> raqamli buyurtmangiz muvaffaqiyatli yetkazib berildi!`,
            '',
            `🥩 Go'sht sifati va yetkazish xizmatimiz sizga ma'qul bo'ldimi?`,
            `Iltimos, o'z bahoingizni qoldiring:`,
          ].join('\n');

          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: targetChatId,
              text: rateText,
              parse_mode: 'HTML',
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
            }),
          }).catch(() => {});
        } else if (status === 'delivering') {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: targetChatId,
              text: `🚗 <b>Hurmatli ${order.customerName || 'mijoz'}!</b>\n\nSizning <code>#${order.id}</code> raqamli go'sht buyurtmangiz kuryerga topshirildi va uyingiz tomon <b>yo'lga chiqdi</b>! Tez orada yetib boradi.`,
              parse_mode: 'HTML',
            }),
          }).catch(() => {});
        } else if (status === 'confirmed') {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: targetChatId,
              text: `✅ <b>Hurmatli ${order.customerName || 'mijoz'}!</b>\n\nSizning <code>#${order.id}</code> raqamli buyurtmangiz <b>qabul qilindi va tasdiqlandi</b>!`,
              parse_mode: 'HTML',
            }),
          }).catch(() => {});
        } else if (status === 'cooking') {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: targetChatId,
              text: `👨‍🍳 <b>Hurmatli ${order.customerName || 'mijoz'}!</b>\n\nSizning <code>#${order.id}</code> raqamli buyurtmangiz <b>tayyorlanmoqda</b> (yangi go'sht saralanib, qadoqlanmoqda).`,
              parse_mode: 'HTML',
            }),
          }).catch(() => {});
        } else if (status === 'cancelled') {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: targetChatId,
              text: `❌ <b>Hurmatli ${order.customerName || 'mijoz'}!</b>\n\nSizning <code>#${order.id}</code> raqamli buyurtmangiz bekor qilindi.\nSavollar bo'yicha: +998 90 616 87 12`,
              parse_mode: 'HTML',
            }),
          }).catch(() => {});
        }
      }

      return NextResponse.json({ success: true, order: orders[idx] });
    }

    return NextResponse.json({ error: 'Order not found in server DB' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
