import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dino Stock Checker - ระบบตรวจนับสต็อกและสั่งซื้อสินค้า",
  description: "Stock Checker & Supplier Order System for Mobile & Desktop",
  icons: {
    icon: "/dino-logo.png",
    apple: "/dino-logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100">
        <main className="min-h-screen max-w-md mx-auto sm:max-w-xl md:max-w-4xl shadow-sm bg-white min-h-screen flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
