'use client';

import { useState, useEffect } from 'react';
import { Product, Review, defaultReviews } from '../data/products';
import { useCart } from '../context/CartContext';
import { getReviews } from '../lib/storage';
import WeightSelector from './WeightSelector';
import ReviewModal from './ReviewModal';
import styles from './ProductCard.module.css';

interface Props {
  product: Product;
  index: number;
}

const CATEGORY_EMOJI: Record<string, string> = {
  mol: '🐄',
  qoy: '🐑',
  qiyma: '🥩',
  tovuq: '🐔',
  kabob: '🔥',
  suyakli: '🦴',
  quyon: '🐇',
};

const BADGE_COLOR: Record<string, string> = {
  Bestseller: '#f39c12',
  Yangi: '#27ae60',
  Chegirma: '#e74c3c',
};

export default function ProductCard({ product, index }: Props) {
  const { addItem } = useCart();
  const [weightG, setWeightG] = useState(1000);
  const [added, setAdded]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(defaultReviews);

  useEffect(() => {
    setReviews(getReviews());
  }, []);

  const refreshReviews = () => {
    setReviews(getReviews());
  };

  const productReviews = reviews.filter(
    r => r.targetType === 'product' && r.targetId === product.id
  );
  const avgRating = productReviews.length > 0
    ? (productReviews.reduce((acc, r) => acc + r.rating, 0) / productReviews.length).toFixed(1)
    : '5.0';
  const reviewCount = productReviews.length;

  const fmt = (n: number) => Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  const handleAdd = () => {
    if (!product.inStock) return;
    addItem(product, weightG);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <>
      <div
        className={styles.card}
        style={{ animationDelay: `${index * 0.08}s` }}
        id={`product-${product.id}`}
      >
        {/* Rasm */}
        <div className={styles.imageWrap}>
          <img
            src={product.image}
            alt={product.name}
            className={styles.image}
            loading="lazy"
          />
          <div className={styles.imageOverlay} />

          {/* Kategoriya badge */}
          <span className={styles.categoryBadge}>
            {CATEGORY_EMOJI[product.category] || '🥩'} {product.category}
          </span>

          {/* Maxsus badge (Bestseller, Yangi …) */}
          {product.badge && (
            <span
              className={styles.specialBadge}
              style={{ background: BADGE_COLOR[product.badge] || '#636363' }}
            >
              {product.badge}
            </span>
          )}

          {/* Mavjudlik */}
          <span className={`${styles.stockBadge} ${product.inStock ? styles.inStock : styles.outStock}`}>
            {product.inStock ? '✓ Mavjud' : '✗ Tugadi'}
          </span>
        </div>

        {/* Kontent */}
        <div className={styles.content}>
          <div className={styles.header}>
            <div
              className={styles.ratingBar}
              onClick={() => setShowModal(true)}
              title="Baholar va izohlarni ko'rish"
            >
              <span className={styles.starIcon}>★</span>
              <span className={styles.ratingScore}>{avgRating}</span>
              <span className={styles.ratingCount}>
                ({reviewCount > 0 ? `${reviewCount} ta izoh` : 'Baho berish'})
              </span>
            </div>

            <h3 className={styles.name}>{product.name}</h3>
            <p className={styles.desc}>{product.description}</p>
          </div>

          {/* Narx */}
          <div className={styles.priceRow}>
            <span className={styles.priceNum} suppressHydrationWarning>{fmt(product.price)}</span>
            <span className={styles.priceUnit}>so'm / kg</span>
          </div>

          {/* Vazn tanlash */}
          {product.inStock && (
            <WeightSelector
              value={weightG}
              onChange={setWeightG}
              pricePerKg={product.price}
            />
          )}

          {/* Tugma */}
          <button
            className={`${styles.addBtn} ${added ? styles.addedBtn : ''} ${!product.inStock ? styles.disabledBtn : ''}`}
            onClick={handleAdd}
            disabled={!product.inStock}
            id={`add-btn-${product.id}`}
          >
            {added ? (
              <>
                <span>✓</span>
                <span>Savatga qo'shildi!</span>
              </>
            ) : !product.inStock ? (
              <>
                <span>✗</span>
                <span>Tugadi</span>
              </>
            ) : (
              <>
                <span>🛒</span>
                <span>Savatga qo'shish</span>
              </>
            )}
          </button>
        </div>

        <div className={styles.cardGlow} />
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        targetType="product"
        targetId={product.id}
        targetName={product.name}
        reviews={reviews}
        onReviewAdded={refreshReviews}
      />
    </>
  );
}
