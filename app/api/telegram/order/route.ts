import { NextResponse } from 'next/server';
import { readOrders, writeOrders } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = body.token || process.env.TELEGRAM_BOT_TOKEN || '9057174699:AAFZXhyddBXk4pf-caIjev1W4nd5sg0K2_U';
    const chatId = body.chatId || process.env.TELEGRAM_CHAT_ID || '6985755311';
    const text = body.text;

    // Save order if provided
    if (body.order) {
      try {
        const orders = readOrders();
        const exists = orders.some((o: any) => o.id === body.order.id);
        if (!exists) {
          orders.unshift(body.order);
          writeOrders(orders);
        }
      } catch (e) {
        console.error('Error saving order:', e);
      }
    }

    if (!token || !chatId || !text) {
      return NextResponse.json({ error: 'Token, Chat ID yoki matn yetarli emas' }, { status: 400 });
    }

    const orderId = body.order?.id;
    const inline_keyboard: any[] = [];

    if (orderId) {
      inline_keyboard.push([
        { text: '✅ Qabul qilish', callback_data: `st:confirmed:${orderId}` },
        { text: '👨‍🍳 Tayyorlash', callback_data: `st:cooking:${orderId}` },
      ]);
      inline_keyboard.push([
        { text: '🚗 Kuryer yo\'lda', callback_data: `st:delivering:${orderId}` },
        { text: '✓ Yetkazildi', callback_data: `st:done:${orderId}` },
      ]);
    }

    if (body.order?.location?.mapsLink) {
      inline_keyboard.push([
        { text: '📍 Google Xaritada ochish 🗺️', url: body.order.location.mapsLink },
      ]);
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
        reply_markup: inline_keyboard.length > 0 ? { inline_keyboard } : undefined,
      }),
    });

    const data = await tgRes.json();

    // If order has GPS coordinates, send native interactive Telegram map pin
    if (body.order?.location?.lat && body.order?.location?.lng) {
      await fetch(`https://api.telegram.org/bot${token}/sendLocation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          latitude: body.order.location.lat,
          longitude: body.order.location.lng,
        }),
      }).catch(err => console.error('Error sending location:', err));
    }

    // Mijozning o'z Telegram hisobi bo'lsa (va u admin bo'lmasa), mijozga tasdiq xabari yuboriladi
    const customerChatId = body.order?.chatId;
    if (customerChatId && String(customerChatId) !== String(chatId)) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: customerChatId,
          text: `✅ <b>Hurmatli ${body.order.customerName || 'Mijoz'}!</b>\n\nSizning <code>#${body.order.id}</code> raqamli go'sht buyurtmangiz qabul qilindi!\n\nTez orada operatorimiz siz bilan bog'lanadi. Buyurtmangiz holatini shu botda kuzatishingiz mumkin.`,
          parse_mode: 'HTML',
        }),
      }).catch(() => {});
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
