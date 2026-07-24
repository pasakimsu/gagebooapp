import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NotificationPermission from "@/components/NotificationPermission";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "우리집 가계부",
  description: "가족과 함께 쓰는 가계부",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "가계부",
  },
};

export const viewport: Viewport = {
  themeColor: "#2f2a25",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NotificationPermission />
        {children}
      </body>
    </html>
  );
}
