'use client';

import styles from './Hero.module.css';

interface HeroProps {
  phone: string;
  deliveryMin: number;
  deliveryMax: number;
  botUrl?: string;
  onOrderClick?: () => void;
}

export default function Hero({ phone, deliveryMin, deliveryMax, botUrl, onOrderClick }: HeroProps) {
  const telegramBotUrl = botUrl || 'https://t.me/halolgoshtyetkazishbot';

  return (
    <section className={styles.hero} id="hero">
      <div className={styles.heroBg}>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroPattern}></div>
        {/* Animated orbs */}
        <div className={`${styles.orb} ${styles.orb1}`}></div>
        <div className={`${styles.orb} ${styles.orb2}`}></div>
        <div className={`${styles.orb} ${styles.orb3}`}></div>
      </div>

      <div className={`container ${styles.heroContent}`}>
        <div className={styles.heroLeft}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot}></span>
            Yangi mahsulotlar mavjud
          </div>

          <h1 className={styles.heroTitle}>
            Har doim yangi va{' '}
            <span className={styles.heroHighlight}>halol go'sht</span>{' '}
            mahsulotlari
          </h1>

          <p className={styles.heroDesc}>
            To'g'ridan-to'g'ri uyingizga{' '}
            <strong>{deliveryMin}–{deliveryMax} daqiqa</strong> ichida tezkor yetkazib berish.
            Samarqandning eng sifatli qassobi.
          </p>

          <div className={styles.heroActions}>
            <a
              href="#mahsulotlar"
              className="btn-primary"
              id="hero-order-btn"
              onClick={onOrderClick}
            >
              <span>🛒</span>
              <span>Buyurtma berish</span>
            </a>
            <a
              href={telegramBotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.heroSecondaryBtn}
            >
              <span>🤖</span>
              <span>Telegram bot</span>
            </a>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.statNum}>500+</span>
              <span className={styles.statLabel}>Mamnun mijozlar</span>
            </div>
            <div className={styles.heroDivider}></div>
            <div className={styles.heroStat}>
              <span className={styles.statNum}>6</span>
              <span className={styles.statLabel}>Go'sht turlari</span>
            </div>
            <div className={styles.heroDivider}></div>
            <div className={styles.heroStat}>
              <span className={styles.statNum}>{deliveryMin}min</span>
              <span className={styles.statLabel}>Tezkor yetkazish</span>
            </div>
          </div>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.heroImageWrap}>
            <div className={styles.heroImageGlow}></div>
            <img
              src="https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80"
              alt="Sifatli go'sht mahsulotlari"
              className={styles.heroImage}
            />
            <div className={styles.heroImageBadge}>
              <span className={styles.heroImageBadgeIcon}>✅</span>
              <div>
                <div className={styles.heroImageBadgeTitle}>Halol sertifikat</div>
                <div className={styles.heroImageBadgeDesc}>Sifat kafolati</div>
              </div>
            </div>
            <div className={styles.heroImageBadge2}>
              <span>🚀</span>
              <div>
                <div className={styles.heroImageBadgeTitle}>{deliveryMin}–{deliveryMax} daqiqa</div>
                <div className={styles.heroImageBadgeDesc}>Yetkazib berish</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.heroWave}>
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="var(--bg)" />
        </svg>
      </div>
    </section>
  );
}
