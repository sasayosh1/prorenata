import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_JP } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Analytics from "@/components/Analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  display: 'swap',
});

// キャッシュを強制的に無効化
export const dynamic = 'force-dynamic'
export const revalidate = 0

// SEO最適化されたメタデータ
export const metadata: Metadata = {
  // 基本メタデータ
  title: {
    default: "ProReNata | 看護助手向け情報サイト - 現場経験者が教える実践的ガイド",
    template: "%s | ProReNata"
  },
  description: "看護助手として働く方、目指す方のための専門情報サイト。転職、資格、給与、現場ノウハウなど実践的な情報を現場経験者が詳しく解説します。",
  keywords: [
    "看護助手",
    "看護補助者", 
    "医療現場",
    "転職",
    "資格",
    "給料",
    "キャリア",
    "ノウハウ",
    "病院",
    "クリニック",
    "介護施設",
    "医療助手"
  ],
  
  // 作者・サイト情報
  authors: [{ name: "ProReNata編集部" }],
  creator: "ProReNata",
  publisher: "ProReNata",
  
  // URL設定
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://prorenata.jp'),
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://prorenata.jp',
    languages: {
      'ja-JP': process.env.NEXT_PUBLIC_SITE_URL || 'https://prorenata.jp'
    }
  },
  
  // Open Graph (SNS共有最適化)
  openGraph: {
    type: 'website',
    siteName: 'ProReNata',
    title: 'ProReNata | 看護助手向け情報サイト',
    description: '看護助手として働く方、目指す方のための専門情報サイト。現場経験者による実践的なガイドを提供します。',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://prorenata.jp',
    locale: 'ja_JP',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ProReNata - 看護助手向け情報サイト',
        type: 'image/png'
      }
    ]
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    site: '@prorenata',
    creator: '@prorenata',
    title: 'ProReNata | 看護助手向け情報サイト',
    description: '看護助手として働く方、目指す方のための専門情報サイト',
    images: ['/twitter-image.png']
  },
  
  // 検索エンジン最適化
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // アプリ情報
  applicationName: 'ProReNata',
  category: 'Medical Information',
  classification: 'Healthcare',
  
  // その他のSEO設定
  other: {
    'google-site-verification': process.env.GOOGLE_SITE_VERIFICATION || '',
    'msvalidate.01': process.env.BING_SITE_VERIFICATION || '',
  },
  
  // マニフェスト
  manifest: '/manifest.json',
  
  // アイコン設定
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#3b82f6' }
    ]
  }
};

// ビューポート設定
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' }
  ],
  colorScheme: 'light'
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} ${geistMono.variable} ${notoSansJP.variable}`}>
      <head>
        {/* 構造化データ - 組織情報 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "ProReNata",
              "url": "https://prorenata.jp",
              "description": "看護助手向け情報サイト",
              "logo": "https://prorenata.jp/logo.png",
              "foundingDate": "2025",
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "url": "https://prorenata.jp/contact"
              }
            })
          }}
        />

        {/* 構造化データ - Webサイト情報 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "ProReNata",
              "url": "https://prorenata.jp",
              "description": "看護助手として働く方、目指す方のための専門情報サイト",
              "inLanguage": "ja-JP",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://prorenata.jp/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "publisher": {
                "@type": "Organization",
                "name": "ProReNata"
              }
            })
          }}
        />


        {/* Google Search Console 確認 */}
        <meta name="google-site-verification" content="Xy7fDHrYsVObXVQeb0D3He2A" />

        {/* DNS プリフェッチ */}
        <link rel="dns-prefetch" href="//cdn.sanity.io" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansJP.variable} antialiased`}
      >
        {/* Skip to content リンク (アクセシビリティ) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
        >
          メインコンテンツにスキップ
        </a>
        
        <main id="main-content" className="min-h-screen">
          {children}
        </main>
        
        {/* Analytics コンポーネント */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <Analytics />
        )}

        {/* Google Analytics (本番環境用) */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                  page_title: document.title,
                  page_location: window.location.href,
                  anonymize_ip: true,
                  allow_google_signals: false,
                  allow_ad_personalization_signals: false
                });
              `}
            </Script>
          </>
        )}

        {/* Google AdSense (本番環境用) */}
        {process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}

      </body>
    </html>
  );
}
