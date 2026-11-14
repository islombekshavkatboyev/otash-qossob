'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { getSettings } from '../lib/storage';
import { saveOrder, generateOrderId, formatWeight, calcItemPrice } from '../lib/storage';
import { SiteSettings, Order, defaultSettings } from '../data/products';
import styles from './checkout.module.css';

type DeliveryType = 'delivery' | 'pickup';
type PaymentType  = 'cash' | 'card';
type Zone         = 'samarqand' | 'urgut';

export default function CheckoutPage() {
  const router                    = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const [settings, setSettings]   = useState<SiteSettings>(defaultSettings);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId]     = useState('');

  // Form holati
  const [name, setName]           = useState('');
  const [phone, setPhone]         = useState('');
  const [address, setAddress]     = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');
  const [zone, setZone]           = useState<Zone>('samarqand');
  const [paymentType, setPaymentType]   = useState<PaymentType>('cash');
  const [note, setNote]           = useState('');

  // GPS lokatsiya
  const [location, setLocation]       = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError]     = useState('');

  const fmt = (n: number) => Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  useEffect(() => { setSettings(getSettings()); }, []);

  // GPS lokatsiya aniqlash
  const getLocation = () => {
    setLocationLoading(true);
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Brauzeringiz GPS ni qo\'llamaydi.');
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
      },
      () => {
        setLocationError('Ruxsat berilmadi yoki aniqlab bo\'lmadi. Manzilni qo\'lda kiriting.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Yetkazib berish narxi
  const zones = settings.deliverySettings.zones || [];
  const selectedZone = zones.find(z => z.id === zone);
  const deliveryPrice =
    deliveryType === 'delivery'
      ? (totalPrice >= (selectedZone?.freeFrom ?? 300000) ? 0 : (selectedZone?.price ?? 15000))
      : 0;
  const grandTotal = totalPrice + deliveryPrice;

  // Buyurtma yuborish
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || (deliveryType === 'delivery' && !address)) return;
    setSubmitting(true);

    const id = generateOrderId();
    const orderLocation = location
      ? { lat: location.lat, lng: location.lng, mapsLink: `https://maps.google.com/?q=${location.lat},${location.lng}` }
      : undefined;
    const order: Order = {
      id,
      items,
      customerName: name,
      phone,
      address: deliveryType === 'delivery' ? address : "Do'kondan olib ketish",
      deliveryType,
      deliveryZone: deliveryType === 'delivery' ? zone : undefined,
      paymentType,
      note,
      totalPrice,
      deliveryPrice,
      status: 'new',
      createdAt: new Date().toISOString(),
      location: orderLocation,
    };

    // LocalStorage ga saqlash
    saveOrder(order);

    // Server bazasiga saqlash
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    }).catch(e => console.error('Error saving order to /api/orders:', e));

    // Telegram ga yuborish (agar token va chat_id bo'lsa)
    const botToken = settings.telegramBotToken || '9057174699:AAFZXhyddBXk4pf-caIjev1W4nd5sg0K2_U';
    const chatId = settings.telegramChatId || '6985755311';

    if (botToken && chatId) {
      try {
        const escapeHtml = (str: string) =>
          (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        const zoneLabel = zone === 'samarqand' ? 'Samarqand shahri' : 'Urgut tumani';
        const itemsText = items
          .map(i => `  🥩 <b>${escapeHtml(i.product.name)}</b> — ${formatWeight(i.weightG)} = <b>${fmt(calcItemPrice(i.product.price, i.weightG))} so'm</b>`)
          .join('\n');

        const text = [
          `🥩 <b>YANGI BUYURTMA</b> — <code>${id}</code>`,
          '',
          `👤 <b>Mijoz:</b> ${escapeHtml(name)}`,
          `📞 <b>Telefon:</b> <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a>`,
          `🏠 <b>Manzil:</b> ${deliveryType === 'delivery' ? `${escapeHtml(address)} (${zoneLabel})` : "Do'kondan olib ketish"}`,
          `💳 <b>To'lov turi:</b> ${paymentType === 'cash' ? '💵 Naqd pul' : '💳 Karta'}`,
          '',
          '<b>Buyurtma tarkibi:</b>',
          itemsText,
          '',
          `📦 <b>Mahsulotlar:</b> ${fmt(totalPrice)} so'm`,
          deliveryPrice > 0 ? `🚗 <b>Yetkazib berish:</b> ${fmt(deliveryPrice)} so'm` : '🚗 <b>Yetkazib berish:</b> Bepul',
          `💰 <b>JAMI TO'LOV:</b> <b>${fmt(grandTotal)} so'm</b>`,
          note ? `\n📝 <b>Izoh:</b> ${escapeHtml(note)}` : '',
          orderLocation ? `\n📍 <b>GPS Manzil:</b> <a href="${orderLocation.mapsLink}">Xaritada ochish 🗺️</a>` : '',
        ].filter(Boolean).join('\n');

        await fetch('/api/telegram/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: botToken,
            chatId: chatId,
            text,
            order: {
              ...order,
              chatId,
            },
          }),
        }).catch(() => {
          return fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text,
              parse_mode: 'HTML',
            }),
          });
        });
      } catch {
        // Telegram yuborilmasa ham buyurtma davom etadi
      }
    }

    setOrderId(id);
    clearCart();
    setSubmitted(true);
    setSubmitting(false);
  };

  // ─── Muvaffaqiyat ekrani ─────────────────────────────────
  if (submitted) {
    return (
      <div className={styles.successPage}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✅</div>
          <h1 className={styles.successTitle}>Buyurtma qabul qilindi!</h1>
          <p className={styles.successDesc}>
            Buyurtma raqamingiz: <strong>{orderId}</strong>
          </p>
          <p className={styles.successDesc}>
            Tez orada operatorimiz <strong>{phone}</strong> raqamiga qo'ng'iroq qiladi.
          </p>
          <div className={styles.successActions}>
            {settings.telegramBotUsername && (
              <a
                href={`https://t.me/${settings.telegramBotUsername}?start=${orderId}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.botBtn}
              >
                🤖 Botda buyurtma va holatini kuzatish
              </a>
            )}
            <Link href="/" className={styles.homeBtn}>
              🏠 Bosh sahifaga
            </Link>
            <a href={settings.telegram} target="_blank" rel="noopener noreferrer" className={styles.tgBtn}>
              ✈️ Telegram orqali bog'lanish
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─── Savat bo'sh ─────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className={styles.emptyPage}>
        <div className={styles.emptyCard}>
          <div className={styles.emptyIcon}>🛒</div>
          <h2>Savat bo'sh</h2>
          <p>Avval mahsulotlarni savatga qo'shing</p>
          <Link href="/" className={styles.backBtn}>← Mahsulotlarga qaytish</Link>
        </div>
      </div>
    );
  }

  // ─── Asosiy forma ─────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <Link href="/" className={styles.backLink}>← Orqaga</Link>
        <h1 className={styles.pageTitle}>🛒 Buyurtma berish</h1>
      </div>

      <div className={styles.layout}>
        {/* Sol: forma */}
        <form className={styles.form} onSubmit={handleSubmit}>

          {/* ─── Mijoz ma'lumotlari ─── */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>👤 Shaxsiy ma'lumotlar</h2>
            <div className={styles.fieldGroup}>
              <div className={styles.field}>
                <label className={styles.label}>Ism-familiya *</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Masalan: Alisher Karimov"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Telefon raqami *</label>
                <input
                  className={styles.input}
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* ─── Yetkazib berish ─── */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>🚗 Yetkazib berish</h2>

            <div className={styles.radioGroup}>
              <label className={`${styles.radioCard} ${deliveryType === 'delivery' ? styles.radioActive : ''}`}>
                <input
                  type="radio" name="delivery" value="delivery"
                  checked={deliveryType === 'delivery'}
                  onChange={() => setDeliveryType('delivery')}
                />
                <span className={styles.radioIcon}>🚗</span>
                <div>
                  <div className={styles.radioTitle}>Yetkazib berish</div>
                  <div className={styles.radioDesc}>Manzilingizga olib keladi</div>
                </div>
              </label>
              <label className={`${styles.radioCard} ${deliveryType === 'pickup' ? styles.radioActive : ''}`}>
                <input
                  type="radio" name="delivery" value="pickup"
                  checked={deliveryType === 'pickup'}
                  onChange={() => setDeliveryType('pickup')}
                />
                <span className={styles.radioIcon}>🏪</span>
                <div>
                  <div className={styles.radioTitle}>Do'kondan olib ketish</div>
                  <div className={styles.radioDesc}>Bepul</div>
                </div>
              </label>
            </div>

            {deliveryType === 'delivery' && (
              <>
                {/* Hudud */}
                <div className={styles.field} style={{ marginTop: '16px' }}>
                  <label className={styles.label}>Yetkazish hududi *</label>
                  <div className={styles.zoneGroup}>
                    {zones.map(z => (
                      <label
                        key={z.id}
                        className={`${styles.zoneCard} ${zone === z.id ? styles.zoneActive : ''}`}
                      >
                        <input
                          type="radio" name="zone" value={z.id}
                          checked={zone === z.id}
                          onChange={() => setZone(z.id as Zone)}
                        />
                        <div className={styles.zoneName}>{z.name}</div>
                        <div className={styles.zonePrice}>
                          {totalPrice >= z.freeFrom
                            ? '🎉 Bepul'
                            : `${fmt(z.price)} so'm`}
                        </div>
                        <div className={styles.zoneTime}>{z.minTime}–{z.maxTime} daqiqa</div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>To'liq manzil *</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Ko'cha, uy raqami, mo'ljal..."
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
              </>
            )}
          </div>

          {/* ─── To'lov ─── */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>💳 To'lov usuli</h2>
            <div className={styles.radioGroup}>
              <label className={`${styles.radioCard} ${paymentType === 'cash' ? styles.radioActive : ''}`}>
                <input
                  type="radio" name="payment" value="cash"
                  checked={paymentType === 'cash'}
                  onChange={() => setPaymentType('cash')}
                />
                <span className={styles.radioIcon}>💵</span>
                <div>
                  <div className={styles.radioTitle}>Naqd pul</div>
                  <div className={styles.radioDesc}>Yetkazib berganda to'lash</div>
                </div>
              </label>
              <label className={`${styles.radioCard} ${paymentType === 'card' ? styles.radioActive : ''}`}>
                <input
                  type="radio" name="payment" value="card"
                  checked={paymentType === 'card'}
                  onChange={() => setPaymentType('card')}
                />
                <span className={styles.radioIcon}>💳</span>
                <div>
                  <div className={styles.radioTitle}>Karta</div>
                  <div className={styles.radioDesc}>POS terminal orqali</div>
                </div>
              </label>
            </div>
          </div>

          {/* ─── Izoh ─── */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>📝 Qo'shimcha izoh (ixtiyoriy)</h2>
            <textarea
              className={styles.textarea}
              placeholder="Maxsus tilak yoki qo'shimcha ma'lumot..."
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
            />
          </div>

          {/* ─── GPS Lokatsiya ─── */}
          {deliveryType === 'delivery' && (
            <div className={styles.locationCard}>
              <h2 className={styles.cardTitle}>📍 Joylashuvingizni ulashing (ixtiyoriy)</h2>
              <p className={styles.locationHint}>Kuryer tezroq topishi uchun GPS joylashuvingizni yuboring</p>
              {!location ? (
                <button
                  type="button"
                  className={styles.locationBtn}
                  onClick={getLocation}
                  disabled={locationLoading}
                >
                  {locationLoading ? '⏳ Aniqlanmoqda...' : '📍 Joylashuvimni aniqlash'}
                </button>
              ) : (
                <div className={styles.locationResult}>
                  <span className={styles.locationCoords}>
                    ✅ {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  </span>
                  <a
                    href={`https://maps.google.com/?q=${location.lat},${location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.mapsLink}
                  >
                    🗺️ Google Maps&apos;da ko&apos;rish
                  </a>
                  <button
                    type="button"
                    className={styles.locationClearBtn}
                    onClick={() => setLocation(null)}
                  >
                    ✕ O&apos;chirish
                  </button>
                </div>
              )}
              {locationError && <p className={styles.locationError}>{locationError}</p>}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submitting}
          >
            {submitting ? (
              <>⏳ Yuborilmoqda...</>
            ) : (
              <>✅ Buyurtmani tasdiqlash</>
            )}
          </button>
        </form>

        {/* O'ng: buyurtma xulosasi */}
        <aside className={styles.summary}>
          <div className={styles.summaryCard}>
            <h2 className={styles.cardTitle}>📋 Buyurtma xulosasi</h2>

            <div className={styles.summaryItems}>
              {items.map(item => (
                <div key={item.product.id} className={styles.summaryItem}>
                  <img src={item.product.image} alt={item.product.name} className={styles.summaryImg} />
                  <div className={styles.summaryInfo}>
                    <div className={styles.summaryName}>{item.product.name}</div>
                    <div className={styles.summaryWeight}>{formatWeight(item.weightG)}</div>
                  </div>
                  <div className={styles.summaryPrice}>
                    {fmt(calcItemPrice(item.product.price, item.weightG))} so'm
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.summaryTotals}>
              <div className={styles.summaryRow}>
                <span>Mahsulotlar:</span>
                <span>{fmt(totalPrice)} so'm</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Yetkazib berish:</span>
                <span>
                  {deliveryType === 'pickup'
                    ? 'Bepul (olib ketish)'
                    : deliveryPrice === 0
                    ? '🎉 Bepul'
                    : `${fmt(deliveryPrice)} so'm`}
                </span>
              </div>
              <div className={`${styles.summaryRow} ${styles.grandTotal}`}>
                <span>Jami:</span>
                <span>{fmt(grandTotal)} so'm</span>
              </div>
            </div>

            {deliveryType === 'delivery' && selectedZone && totalPrice < selectedZone.freeFrom && (
              <div className={styles.freeDeliveryHint}>
                💡 Yana {fmt(selectedZone.freeFrom - totalPrice)} so'm qo'shsangiz, yetkazib berish bepul!
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

