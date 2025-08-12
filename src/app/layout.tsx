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
  title: {
    default: "ProReNata - 元看護助手の日記",
    template: "%s | ProReNata"
  },
  description: "必要に応じて、その都度。元看護助手が書く、医療現場での体験や日常、趣味について綴る個人ブログです。",
  keywords: "看護助手, 医療現場, 体験談, 日記, ブログ, 趣味",
  authors: [{ name: "ProReNata" }],
  creator: "ProReNata",
  publisher: "ProReNata",
  metadataBase: new URL('https://prorenata03250706.vercel.app'),
  alternates: {
    canonical: 'https://prorenata03250706.vercel.app',
  },
  openGraph: {
    title: "ProReNata - 元看護助手の日記",
    description: "元看護助手が書く、医療現場での体験や日常、趣味について綴る個人ブログです。",
    url: 'https://prorenata03250706.vercel.app',
    siteName: 'ProReNata',
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ProReNata - 元看護助手の日記',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "ProReNata - 元看護助手の日記",
    description: "元看護助手が書く、医療現場での体験や趣味について綴る個人ブログです。",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
