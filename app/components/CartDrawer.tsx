'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { formatWeight, calcItemPrice } from '../lib/storage';
import styles from './CartDrawer.module.css';

export default function CartDrawer() {
  const {
    items, totalPrice, isOpen, closeCart,
    removeItem, updateWeight,
  } = useCart();

  const fmt = (n: number) => Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  // ESC bilan yopish
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCart(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, closeCart]);

  // body scroll lock
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else        document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <aside className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}>
        {/* Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerTitle}>
            <span>🛒</span>
            <span>Savat</span>
            {items.length > 0 && (
              <span className={styles.itemCount}>{items.length} ta mahsulot</span>
            )}
          </div>
          <button className={styles.closeBtn} onClick={closeCart} aria-label="Yopish">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.drawerBody}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🛒</span>
              <p>Savat bo'sh</p>
              <span>Mahsulot qo'shing</span>
            </div>
          ) : (
            <div className={styles.itemList}>
              {items.map(item => {
                const lineTotal = calcItemPrice(item.product.price, item.weightG);
                return (
                  <div key={item.product.id} className={styles.cartItem}>
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className={styles.cartImg}
                    />
                    <div className={styles.cartInfo}>
                      <div className={styles.cartName}>{item.product.name}</div>
                      <div className={styles.cartPrice}>
                        {fmt(lineTotal)} so'm
                      </div>

                      {/* Vazn ± tugmalari */}
                      <div className={styles.qtyRow}>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => updateWeight(item.product.id, item.weightG - 250)}
                        >−</button>
                        <span className={styles.qtyLabel}>
                          {formatWeight(item.weightG)}
                        </span>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => updateWeight(item.product.id, item.weightG + 250)}
                        >+</button>
                      </div>
                    </div>

                    <button
                      className={styles.removeBtn}
                      onClick={() => removeItem(item.product.id)}
                      aria-label="O'chirish"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className={styles.drawerFooter}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Jami:</span>
              <span className={styles.totalPrice}>{fmt(totalPrice)} so'm</span>
            </div>
            <Link
              href="/checkout"
              className={styles.checkoutBtn}
              onClick={closeCart}
            >
              <span>✅</span>
              <span>Buyurtma berish</span>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}

