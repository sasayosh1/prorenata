import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// キャッシュを強制的に無効化
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "ProReNata",
  description: "必要に応じて、その都度。状況に応じた最適な情報をお届けします。",
  metadataBase: new URL('https://prorenata.jp'),
  alternates: {
    canonical: 'https://prorenata.jp',
  },
  openGraph: {
    title: "ProReNata",
    description: "必要に応じて、その都度。状況に応じた最適な情報をお届けします。",
    url: 'https://prorenata.jp',
    siteName: 'ProReNata',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "ProReNata",
    description: "必要に応じて、その都度。状況に応じた最適な情報をお届けします。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
