'use client';

import { useState, useEffect } from 'react';
import { Product, SiteSettings, Review, defaultProducts, defaultSettings, defaultReviews } from './data/products';
import { getProducts, getSettings, getReviews, formatDate } from './lib/storage';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import ReviewModal from './components/ReviewModal';
import { useCart } from './context/CartContext';
import styles from './page.module.css';

export default function Home() {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [reviews, setReviews]   = useState<Review[]>(defaultReviews);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [filter, setFilter]     = useState('all');
  const { items, totalPrice, openCart } = useCart();

  const fmt = (n: number) => Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  useEffect(() => {
    setProducts(getProducts());
    setSettings(getSettings());
    setReviews(getReviews());
  }, []);

  const refreshReviews = () => {
    setReviews(getReviews());
  };

  const categories = [
    { id: 'all',     label: 'Hammasi',         emoji: '🥩' },
    { id: 'mol',     label: "Mol go'shti",      emoji: '🐄' },
    { id: 'qoy',     label: "Qo'y go'shti",     emoji: '🐑' },
    { id: 'tovuq',   label: 'Tovuq',            emoji: '🐔' },
    { id: 'qiyma',   label: 'Qiyma',            emoji: '🥩' },
    { id: 'kabob',   label: "Kaboblik",         emoji: '🔥' },
    { id: 'suyakli', label: "Suyakli",          emoji: '🦴' },
  ];

  const filteredProducts = filter === 'all'
    ? products
    : products.filter(p => p.category === filter);

  const { deliverySettings } = settings;

  return (
    <>
      <Navbar />
      <CartDrawer />

      <Hero
        phone={settings.phone}
        deliveryMin={deliverySettings.minTime}
        deliveryMax={deliverySettings.maxTime}
        botUrl={`https://t.me/${settings.telegramBotUsername || 'halolgoshtyetkazishbot'}`}
        onOrderClick={() => setFilter('all')}
      />

      {/* Products Section */}
      <section className={styles.productsSection} id="mahsulotlar">
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="section-badge">Menyumiz</span>
            <h2 className={`section-title ${styles.sectionTitleCenter}`}>
              Bizning <span className="gradient-text">mahsulotlar</span>
            </h2>
            <p className="section-subtitle">
              Yangi va halol go'sht mahsulotlari. Har kuni yangi keltiriladi.
              Vazn tanlang va savatga qo'shing!
            </p>
          </div>

          {/* Filter tabs */}
          <div className={styles.filterBar}>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`${styles.filterBtn} ${filter === cat.id ? styles.filterBtnActive : ''}`}
                onClick={() => setFilter(cat.id)}
                id={`filter-${cat.id}`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className={styles.productsGrid}>
            {filteredProducts.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                index={i}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className={styles.noProducts}>
              <span>😕</span>
              <p>Bu kategoriyada mahsulot yo'q</p>
            </div>
          )}
        </div>
      </section>

      {/* Delivery Section */}
      <section className={styles.deliverySection} id="yetkazib-berish">
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="section-badge">Xizmatimiz</span>
            <h2 className={`section-title ${styles.sectionTitleCenter}`}>
              Tezkor <span className="gradient-text">yetkazib berish</span>
            </h2>
          </div>

          <div className={styles.deliveryGrid}>
            {/* Samarqand */}
            <div className={styles.deliveryCard}>
              <div className={styles.deliveryIcon}>🏙️</div>
              <h3 className={styles.deliveryTitle}>Samarqand shahri</h3>
              <p className={styles.deliveryDesc} suppressHydrationWarning>
                {deliverySettings.minTime}–{deliverySettings.maxTime} daqiqa ichida yetkazamiz.
                {fmt(deliverySettings.zones?.[0]?.freeFrom ?? 300000)} so'mdan bepul!
              </p>
            </div>

            <div className={styles.deliveryCard}>
              <div className={styles.deliveryIcon}>🌿</div>
              <h3 className={styles.deliveryTitle}>Urgut tumani</h3>
              <p className={styles.deliveryDesc} suppressHydrationWarning>
                45–90 daqiqa ichida yetkazamiz.
                {fmt(deliverySettings.zones?.[1]?.freeFrom ?? 400000)} so'mdan bepul!
              </p>
            </div>

            <div className={styles.deliveryCard}>
              <div className={styles.deliveryIcon}>✅</div>
              <h3 className={styles.deliveryTitle}>Halol kafolat</h3>
              <p className={styles.deliveryDesc}>
                Barcha mahsulotlarimiz sertifikatlangan va halol. Sifat kafolati beriladi.
              </p>
            </div>

            <div className={styles.deliveryCard}>
              <div className={styles.deliveryIcon}>💳</div>
              <h3 className={styles.deliveryTitle}>Naqd va karta</h3>
              <p className={styles.deliveryDesc}>
                Naqd pul yoki karta orqali to'lash mumkin. POS terminal mavjud.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className={styles.whySection}>
        <div className="container">
          <div className={styles.whyInner}>
            <div className={styles.whyLeft}>
              <span className="section-badge">Nima uchun biz?</span>
              <h2 className="section-title">
                Samarqandning eng <span className="gradient-text">ishonchli qassobi</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.7', marginTop: '8px' }}>
                Biz 5 yildan ortiq vaqt davomida Samarqand aholisiga sifatli go'sht mahsulotlari yetkazib kelmoqdamiz.
                Har bir mahsulot diqqat bilan tanlanadi va sifat nazoratidan o'tkaziladi.
              </p>
              <ul className={styles.whyList}>
                {[
                  "🥩 Yangi va halol mahsulotlar",
                  "⚖️ Aniq vazn, to'g'ri hisob",
                  "🚀 Tezkor yetkazib berish",
                  "💯 100% sifat kafolati",
                  "📞 24/7 mijozlar xizmati",
                ].map((item, i) => (
                  <li key={i} className={styles.whyItem}>{item}</li>
                ))}
              </ul>
              <a href={`tel:${settings.phone}`} className="btn-primary" style={{ marginTop: '8px', width: 'fit-content' }}>
                <span>📞</span>
                <span>Hoziroq buyurtma bering</span>
              </a>
            </div>

            <div className={styles.whyRight}>
              <div className={styles.whyImageStack}>
                <img
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80"
                  alt="Sifatli go'sht"
                  className={styles.whyImg1}
                />
                <img
                  src="https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=400&q=80"
                  alt="Qovurga"
                  className={styles.whyImg2}
                />
                <div className={styles.whyBadge}>
                  <span className={styles.whyBadgeNum}>5+</span>
                  <span className={styles.whyBadgeText}>Yil tajriba</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews & Ratings Section */}
      <section className={styles.reviewsSection} id="fikrlar">
        <div className="container">
          <div className={styles.reviewsHeaderRow}>
            <div className={styles.reviewsHeaderLeft}>
              <span className="section-badge">Mijozlar fikri</span>
              <h2 className="section-title">
                Haqiqiy mijozlar <span className="gradient-text">baholari</span>
              </h2>
              <div className={styles.reviewScoreBadge}>
                <div className={styles.scoreStars}>★★★★★</div>
                <span className={styles.scoreNum}>5.0</span>
                <span className={styles.scoreDesc}>
                  ({reviews.length} ta xaridor fikri asosida)
                </span>
              </div>
            </div>

            <button
              className={styles.leaveReviewBtn}
              onClick={() => setShowReviewModal(true)}
            >
              ✍️ Baho berish va fikr qoldirish
            </button>
          </div>

          <div className={styles.reviewsGrid}>
            {reviews.slice(0, 6).map(rev => (
              <div key={rev.id} className={styles.reviewCard}>
                <div className={styles.reviewCardTop}>
                  <div className={styles.reviewerMeta}>
                    <div className={styles.reviewerAvatar}>
                      {rev.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className={styles.reviewerName}>{rev.userName}</div>
                      <span className={styles.reviewTargetBadge}>
                        {rev.targetType === 'product' ? `🥩 ${rev.targetName}` : '⭐ Xizmat'}
                      </span>
                    </div>
                  </div>
                  <div className={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} style={{ color: s <= rev.rating ? '#f59e0b' : '#cbd5e1' }}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <p className={styles.reviewComment}>{rev.comment}</p>

                <div className={styles.reviewDate} suppressHydrationWarning>
                  {formatDate(rev.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className={styles.contactSection} id="aloqa">
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="section-badge">Bog'laning</span>
            <h2 className={`section-title ${styles.sectionTitleCenter}`}>
              Biz bilan <span className="gradient-text">aloqa</span>
            </h2>
          </div>

          <div className={styles.contactGrid}>
            <a href={`tel:${settings.phone}`} className={styles.contactCard} id="contact-phone">
              <div className={styles.contactIcon}>📞</div>
              <div className={styles.contactInfo}>
                <span className={styles.contactLabel}>Telefon</span>
                <span className={styles.contactValue}>{settings.phone}</span>
              </div>
              <span className={styles.contactArrow}>→</span>
            </a>

            <a href={settings.telegram || 'https://t.me/Otabek07092000'} target="_blank" rel="noopener noreferrer" className={styles.contactCard} id="contact-telegram">
              <div className={styles.contactIcon}>✈️</div>
              <div className={styles.contactInfo}>
                <span className={styles.contactLabel}>Telegram</span>
                <span className={styles.contactValue}>@Otabek07092000</span>
              </div>
              <span className={styles.contactArrow}>→</span>
            </a>

            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>📍</div>
              <div className={styles.contactInfo}>
                <span className={styles.contactLabel}>Manzil</span>
                <span className={styles.contactValue}>{settings.address}</span>
              </div>
            </div>

            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>⏰</div>
              <div className={styles.contactInfo}>
                <span className={styles.contactLabel}>Ish vaqti</span>
                <span className={styles.contactValue}>{settings.workingHours}</span>
              </div>
            </div>
          </div>

          {/* CTA Banner */}
          <div className={styles.ctaBanner}>
            <div className={styles.ctaContent}>
              <h3 className={styles.ctaTitle}>Hoziroq buyurtma bering!</h3>
              <p className={styles.ctaDesc}>
                Telefon qiling yoki Telegram orqali yozing.{' '}
                {deliverySettings.minTime}–{deliverySettings.maxTime} daqiqada yetkazamiz!
              </p>
            </div>
            <div className={styles.ctaActions}>
              <a href={`tel:${settings.phone}`} className="btn-accent" id="cta-call-btn">
                📞 Qo'ng'iroq
              </a>
              <a href={settings.telegram} target="_blank" rel="noopener noreferrer" className="btn-primary" id="cta-telegram-btn">
                ✈️ Telegram
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer} suppressHydrationWarning>
        <div className="container" suppressHydrationWarning>
          <div className={styles.footerInner}>
            <div className={styles.footerBrand}>
              <div className={styles.footerLogo}>
                <span>🥩</span>
                <span className={styles.footerLogoText}>Halol Go'sht</span>
              </div>
              <p className={styles.footerTagline}>
                Mukammalik tasodifan yuzaga kelmaydi, u sifatga bo'lgan intilishdan boshlanadi.
              </p>
            </div>

            <div className={styles.footerLinks}>
              <h4 className={styles.footerLinksTitle}>Sahifalar</h4>
              <a href="#mahsulotlar" className={styles.footerLink}>Mahsulotlar</a>
              <a href="#yetkazib-berish" className={styles.footerLink}>Yetkazib berish</a>
              <a href="#aloqa" className={styles.footerLink}>Aloqa</a>
            </div>

            <div className={styles.footerContact}>
              <h4 className={styles.footerLinksTitle}>Aloqa</h4>
              <a href={`tel:${settings.phone}`} className={styles.footerLink} suppressHydrationWarning>{settings.phone}</a>
              <span className={styles.footerLink} suppressHydrationWarning>{settings.address}</span>
              <span className={styles.footerLink} suppressHydrationWarning>{settings.workingHours}</span>
            </div>
          </div>

          <div className={styles.footerBottom} suppressHydrationWarning>
            <p suppressHydrationWarning>
              © Islombek Shavkatboyev, Otabek Shavkatboyev. Barcha huquqlar himoyalangan.
              <a
                href="/admin"
                style={{ opacity: 0.3, color: 'inherit', textDecoration: 'none', marginLeft: '12px', fontSize: '11px' }}
                title="Admin panel"
              >
                🔒
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Sticky Cart Bar (mobil) */}
      {items.length > 0 && (
        <div className={styles.stickyCart} onClick={openCart}>
          <div className={styles.stickyCartLeft}>
            <span>🛒</span>
            <span>{items.length} ta mahsulot</span>
          </div>
          <span className={styles.stickyCartPrice}>{fmt(totalPrice)} so'm →</span>
        </div>
      )}

      {/* Umumiy Xizmat Izoh Modali */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        targetType="service"
        targetId="service"
        targetName="Halol Go'sht do'koni va xizmatlari"
        reviews={reviews}
        onReviewAdded={refreshReviews}
      />
    </>
  );
}
