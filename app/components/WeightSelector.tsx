'use client';

import { useState } from 'react';
import styles from './WeightSelector.module.css';
import { formatWeight } from '../lib/storage';

const QUICK_WEIGHTS = [250, 500, 1000, 1500, 2000, 3000];

interface Props {
  value: number;      // gramm
  onChange: (g: number) => void;
  pricePerKg: number;
}

export default function WeightSelector({ value, onChange, pricePerKg }: Props) {
  const [mode, setMode] = useState<'quick' | 'custom'>('quick');
  const [customKg, setCustomKg] = useState('');

  const totalPrice = Math.round((pricePerKg * value) / 1000);
  const fmt = (n: number) => Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  const handleCustomApply = () => {
    const kg = parseFloat(customKg.replace(',', '.'));
    if (!isNaN(kg) && kg > 0) {
      onChange(Math.round(kg * 1000));
    }
  };

  return (
    <div className={styles.wrap}>
      {/* Tezkor vazn tugmalari */}
      <div className={styles.quickRow}>
        {QUICK_WEIGHTS.map(g => (
          <button
            key={g}
            className={`${styles.qBtn} ${value === g && mode === 'quick' ? styles.active : ''}`}
            onClick={() => { setMode('quick'); onChange(g); setCustomKg(''); }}
            type="button"
          >
            {formatWeight(g)}
          </button>
        ))}
        <button
          className={`${styles.qBtn} ${mode === 'custom' ? styles.active : ''}`}
          onClick={() => setMode('custom')}
          type="button"
        >
          ✏️ Boshqa
        </button>
      </div>

      {/* Custom kirish */}
      {mode === 'custom' && (
        <div className={styles.customRow}>
          <input
            className={styles.customInput}
            type="number"
            step="0.1"
            min="0.1"
            max="20"
            placeholder="Masalan: 1.5"
            value={customKg}
            onChange={e => setCustomKg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCustomApply()}
          />
          <span className={styles.customUnit}>kg</span>
          <button
            className={styles.customApply}
            onClick={handleCustomApply}
            type="button"
          >
            ✓
          </button>
        </div>
      )}

      {/* Jami narx */}
      <div className={styles.pricePreview}>
        <span className={styles.weightLabel}>{formatWeight(value)}</span>
        <span className={styles.priceLabel}>= {fmt(totalPrice)} so'm</span>
      </div>
    </div>
  );
}

