import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel - Otash Qassob",
  description: "Otash Qassob admin boshqaruv paneli",
  robots: "noindex, nofollow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
