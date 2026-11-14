'use client';

import React, { useState } from 'react';
import { Review } from '../data/products';
import { saveReview, formatDate } from '../lib/storage';
import styles from './ReviewModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'product' | 'service';
  targetId: string;
  targetName: string;
  reviews: Review[];
  onReviewAdded: () => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
  reviews,
  onReviewAdded,
}: Props) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [userName, setUserName] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const filteredReviews = reviews.filter(
    r => r.targetType === targetType && (targetType === 'service' || r.targetId === targetId)
  );

  const avgRating = filteredReviews.length > 0
    ? (filteredReviews.reduce((acc, r) => acc + r.rating, 0) / filteredReviews.length).toFixed(1)
    : '5.0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !comment.trim()) return;

    setSubmitting(true);
    const newRev: Review = {
      id: 'rev-' + Date.now(),
      targetType,
      targetId,
      targetName,
      userName: userName.trim(),
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    saveReview(newRev);
    setSubmitting(false);
    setSuccess(true);
    setUserName('');
    setComment('');
    onReviewAdded();

    setTimeout(() => {
      setSuccess(false);
    }, 2500);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>
              {targetType === 'product' ? `🥩 ${targetName}` : '⭐ Do\'kon va xizmat sifati'}
            </h3>
            <div className={styles.ratingSummary}>
              <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} className={styles.starFilled}>★</span>
                ))}
              </div>
              <span className={styles.avgNum}>{avgRating}</span>
              <span className={styles.reviewCount}>({filteredReviews.length} ta izoh)</span>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Yopish">✕</button>
        </div>

        {/* Content */}
        <div className={styles.body}>
          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit}>
            <h4 className={styles.formTitle}>✍️ Fikringizni qoldiring</h4>

            {/* Star Selector */}
            <div className={styles.starPicker}>
              <span className={styles.pickerLabel}>Bahoyingiz:</span>
              <div className={styles.starButtons}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`${styles.starBtn} ${(hoverRating || rating) >= star ? styles.starActive : ''}`}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <span className={styles.ratingText}>
                {rating === 5 && 'Zo\'r! (5/5)'}
                {rating === 4 && 'Yaxshi (4/5)'}
                {rating === 3 && 'O\'rtacha (3/5)'}
                {rating === 2 && 'Qoniqarsiz (2/5)'}
                {rating === 1 && 'Yomon (1/5)'}
              </span>
            </div>

            <div className={styles.inputGroup}>
              <input
                type="text"
                className={styles.input}
                placeholder="Ismingiz (masalan: Rustam B.)"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                required
              />
              <textarea
                className={styles.textarea}
                placeholder="Go'sht sifati, ta'mi yoki yetkazib berish haqida fikringiz..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                required
              />
            </div>

            {success && (
              <div className={styles.successMsg}>
                ✅ Rahmat! Fikringiz muvaffaqiyatli qabul qilindi.
              </div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? '⏳ Yuborilmoqda...' : 'Yuborish →'}
            </button>
          </form>

          {/* Reviews List */}
          <div className={styles.reviewsList}>
            <h4 className={styles.reviewsTitle}>Mijozlarimiz nima deydi?</h4>
            {filteredReviews.length === 0 ? (
              <p className={styles.noReviews}>Birinchi bo'lib fikringizni bildiring!</p>
            ) : (
              filteredReviews.map(r => (
                <div key={r.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewerInfo}>
                      <span className={styles.avatar}>{r.userName.charAt(0).toUpperCase()}</span>
                      <div>
                        <div className={styles.reviewerName}>{r.userName}</div>
                        <div className={styles.reviewDate} suppressHydrationWarning>
                          {formatDate(r.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <span key={s} className={s <= r.rating ? styles.starFilled : styles.starEmpty}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className={styles.reviewComment}>{r.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
