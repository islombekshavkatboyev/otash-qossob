'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (locked) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.error || 'Xato yuz berdi.');
        if (data.locked) setLocked(true);
      }
    } catch {
      setError('Server bilan bog\'lanib bo\'lmadi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Animatsion orb-lar */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoEmoji}>🥩</span>
          <div>
            <div className={styles.logoTitle}>Halol Go&apos;sht</div>
            <div className={styles.logoSub}>Admin Panel</div>
          </div>
        </div>

        <h1 className={styles.heading}>Kirish</h1>
        <p className={styles.subheading}>Davom etish uchun tizimga kiring</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Foydalanuvchi nomi</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>👤</span>
              <input
                type="text"
                className={styles.input}
                placeholder="admin"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                required
                disabled={locked}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Parol</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>🔒</span>
              <input
                type={showPass ? 'text' : 'password'}
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={locked}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
                aria-label="Parolni ko'rsatish"
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.errorBox}>
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || locked}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : locked ? (
              '🔒 Bloklangan'
            ) : (
              'Kirish →'
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <a href="/" className={styles.backLink}>← Saytga qaytish</a>
        </div>
      </div>
    </div>
  );
}

