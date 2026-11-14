'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme]       = useState<'light' | 'dark'>('light');
  const { items, totalItems, openCart } = useCart();

  const totalWeight = totalItems; // gramm

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    // Initial theme check
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        setTheme('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  const navLinks = [
    { href: '#mahsulotlar', label: 'Mahsulotlar' },
    { href: '#yetkazib-berish', label: 'Yetkazib berish' },
    { href: '#fikrlar', label: 'Mijozlar fikri' },
    { href: '#aloqa', label: 'Aloqa' },
  ];

  const fmtWeight = (g: number) => {
    if (g >= 1000) return `${(g / 1000).toFixed(g % 1000 === 0 ? 0 : 1)} kg`;
    return `${g} g`;
  };

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
        <div className={`container ${styles.navInner}`}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>🥩</span>
            <div className={styles.logoText}>
              <span className={styles.logoMain}>Halol</span>
              <span className={styles.logoSub}>Go&apos;sht</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className={styles.navLinks}>
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className={styles.navLink}>
                {link.label}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className={styles.navActions}>
            <a href="tel:+998906168712" className={styles.phoneBtn}>
              <span>📞</span>
              <span>+998 90 616 87 12</span>
            </a>

            {/* Savat tugmasi */}
            <button className={styles.cartBtn} onClick={openCart} id="nav-cart-btn">
              <span className={styles.cartIcon}>🛒</span>
              {items.length > 0 && (
                <>
                  <span className={styles.cartBadge}>{items.length}</span>
                  <span className={styles.cartWeight}>{fmtWeight(totalWeight)}</span>
                </>
              )}
            </button>

            {/* Kun / Tun rejimi tugmasi */}
            <button
              className={styles.themeToggleBtn}
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Kunduzgi rejim (Yorug‘)' : 'Tungi rejim (Qorong‘u)'}
              aria-label="Kun va tun rejimini almashtirish"
              id="theme-toggle-btn"
            >
              <span className={styles.themeIcon}>{theme === 'dark' ? '☀️' : '🌙'}</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className={styles.mobileRight}>
            <button
              className={styles.themeToggleBtnMobile}
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Kunduzgi rejim' : 'Tungi rejim'}
              aria-label="Kun va tun rejimini almashtirish"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button className={styles.cartBtnMobile} onClick={openCart}>
              🛒
              {items.length > 0 && (
                <span className={styles.cartBadge}>{items.length}</span>
              )}
            </button>
            <button
              className={styles.menuToggle}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              <span className={`${styles.menuBar} ${menuOpen ? styles.open : ''}`} />
              <span className={`${styles.menuBar} ${menuOpen ? styles.open : ''}`} />
              <span className={`${styles.menuBar} ${menuOpen ? styles.open : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className={styles.mobileMenu}>
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className={styles.mobileLink}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a href="tel:+998906168712" className={styles.mobileCta}>
              📞 Qo&apos;ng&apos;iroq qilish
            </a>
          </div>
        )}
      </nav>
    </>
  );
}
