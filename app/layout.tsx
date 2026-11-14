import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from './context/CartContext';

export const metadata: Metadata = {
  title: "Halol Go'sht — Samarqand va Urgut",
  description:
    "Samarqand va Urgut tumani bo'ylab tezkor yetkazib berish. Halol, yangi va sifatli go'sht mahsulotlari. Mol, qo'y, tovuq, qiyma, kaboblik go'sht.",
  keywords:
    "go'sht, halol, qassob, mol go'shti, qo'y go'shti, tovuq, Samarqand, Urgut, yetkazib berish",
  openGraph: {
    title: "Halol Go'sht",
    description: "Halol, yangi va sifatli go'sht mahsulotlari. Tezkor yetkazib berish.",
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
