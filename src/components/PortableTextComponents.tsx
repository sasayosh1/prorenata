import React from 'react'
import Link from 'next/link'
import { PortableTextComponents, PortableTextComponentProps } from '@portabletext/react'
import { PortableTextBlock } from '@portabletext/types'

// 外部リンクかどうかを判定する関数
function isExternalLink(href: string): boolean {
  if (!href) return false
  
  // 外部URLのパターンを検出
  const externalPatterns = [
    /^https?:\/\//i,           // http:// または https://
    /^\/\/[^\/]/,              // //example.com
    /^www\./i,                 // www.example.com
  ]
  
  return externalPatterns.some(pattern => pattern.test(href))
}

// アフィリエイトリンクかどうかを判定する関数（将来の拡張用）
function isAffiliateLink(href: string): boolean {
  if (!href) return false
  
  // 一般的なアフィリエイトプラットフォームを検出
  const affiliatePatterns = [
    /amazon\.[a-z.]+\/.*[?&]tag=/i,           // Amazon アソシエイト
    /rakuten\.co\.jp/i,                       // 楽天アフィリエイト
    /a8\.net/i,                               // A8.net
    /valuecommerce\.ne\.jp/i,                 // バリューコマース
    /linksynergy\.com/i,                      // LinkShare
    /commission-junction\.com/i,              // CJ Affiliate
    /shareasale\.com/i,                       // ShareASale
    /[?&]aff(iliate)?(_|=)/i,                 // 一般的なアフィリエイトパラメーター
    /[?&](ref|utm_|tracking|partner)=/i,      // トラッキングパラメーター
  ]
  
  return affiliatePatterns.some(pattern => pattern.test(href))
}

// 商品リンクかどうかを判定する関数
function isProductLink(href: string, text: string): boolean {
  const productPatterns = [
    /amazon\./i,
    /rakuten\./i,
    /楽天/i,
  ]
  const textPatterns = [
    /で見る$/,
    /で購入$/,
    /はこちら$/,
  ]

  const hasProductDomain = productPatterns.some(pattern => pattern.test(href))
  const hasProductText = textPatterns.some(pattern => pattern.test(text))

  return hasProductDomain || hasProductText
}

// プラットフォームを判定する関数
function getPlatform(href: string, text: string): 'amazon' | 'rakuten' | 'other' {
  if (/amazon\./i.test(href) || /amazon/i.test(text)) {
    return 'amazon'
  }
  if (/rakuten\./i.test(href) || /楽天/i.test(text)) {
    return 'rakuten'
  }
  return 'other'
}

// カスタムリンクコンポーネント
function CustomLink({
  children,
  value
}: {
  children: React.ReactNode
  value?: {
    href?: string
    _key?: string
    openInNewTab?: boolean
  }
}) {
  const href = value?.href || '#'
  const openInNewTab = value?.openInNewTab
  const isExternal = isExternalLink(href)
  const isAffiliate = isAffiliateLink(href)

  // 子要素からテキストを取得
  const linkText = typeof children === 'string' ? children : ''
  const isProduct = isProductLink(href, linkText)
  const platform = getPlatform(href, linkText)

  // 新しいタブで開くかどうかの判定
  const shouldOpenInNewTab = openInNewTab !== undefined ? openInNewTab : isExternal

  // 商品リンクの場合は専用スタイル
  if (isProduct) {
    const platformStyles = {
      amazon: {
        bg: 'bg-orange-50 hover:bg-orange-100 border border-orange-200',
        text: 'text-orange-700',
        icon: '🛒',
      },
      rakuten: {
        bg: 'bg-red-50 hover:bg-red-100 border border-red-200',
        text: 'text-red-700',
        icon: '🛍️',
      },
      other: {
        bg: 'bg-blue-50 hover:bg-blue-100 border border-blue-200',
        text: 'text-blue-700',
        icon: '🔗',
      },
    }

    const style = platformStyles[platform]

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm
          ${style.bg} ${style.text}
          transition-colors duration-200
          no-underline mx-1
        `}
      >
        <span>{style.icon}</span>
        <span>{children}</span>
      </a>
    )
  }

  // 内部リンクで新しいタブで開かない場合はNext.js Linkを使用
  if (!shouldOpenInNewTab && !isExternal) {
    return (
      <Link
        href={href}
        className="text-blue-600 hover:text-blue-800 underline transition-colors duration-200"
      >
        {children}
      </Link>
    )
  }

  // 通常の外部リンク
  return (
    <a
      href={href}
      target={shouldOpenInNewTab ? "_blank" : undefined}
      rel={shouldOpenInNewTab ? "noopener noreferrer" : undefined}
      className={`
        text-blue-600 hover:text-blue-800 underline transition-colors duration-200
        ${isAffiliate ? 'affiliate-link' : ''}
        ${isExternal ? 'external-link' : 'internal-link'}
        ${shouldOpenInNewTab ? 'new-tab-link' : 'same-tab-link'}
      `.trim()}
      data-external={isExternal}
      data-affiliate={isAffiliate}
      data-new-tab={shouldOpenInNewTab}
      {...(isAffiliate && { 'data-affiliate-link': 'true' })}
    >
      {children}
      {shouldOpenInNewTab && (
        <span
          className="inline-block ml-1 text-xs"
          aria-label={isExternal ? "外部リンク（新しいタブで開く）" : "新しいタブで開く"}
          title={isExternal ? "外部リンク（新しいタブで開く）" : "新しいタブで開く"}
        >
          🔗
        </span>
      )}
      {isAffiliate && (
        <span
          className="inline-block ml-1 text-xs"
          aria-label="PR・アフィリエイトリンク"
          title="PR・アフィリエイトリンク"
        >
          📢
        </span>
      )}
    </a>
  )
}

// カスタム段落コンポーネント（リンクが含まれる可能性があるため）
function CustomParagraph(props: PortableTextComponentProps<PortableTextBlock>) {
  return (
    <p className="mb-6 leading-relaxed text-gray-900 [&]:!text-gray-900" style={{color: '#111827 !important'}}>
      {props.children}
    </p>
  )
}

// カスタム見出しコンポーネント
function CustomHeading({
  children,
  level,
  value
}: {
  children: React.ReactNode
  level: number
  value?: unknown
}) {
  const Tag = `h${Math.max(2, Math.min(6, level + 1))}` as keyof React.JSX.IntrinsicElements

  // 見出しテキストからIDを生成
  const headingText = ((value as { children?: Array<{ _type: string; text?: string }> })?.children
    ?.filter((child) => child._type === 'span')
    ?.map((child) => child.text)
    ?.join(' ')) || ''

  const headingId = headingText
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()

  const headingStyles = {
    2: "text-2xl font-bold mb-6 mt-8 text-gray-900 [&]:!text-gray-900 border-2 border-gray-600 px-4 py-3",
    3: "text-xl font-semibold mb-4 mt-6 text-gray-900 [&]:!text-gray-900",
    4: "text-lg font-semibold mb-3 mt-5 text-gray-900 [&]:!text-gray-900",
    5: "text-base font-semibold mb-2 mt-4 text-gray-900 [&]:!text-gray-900",
    6: "text-sm font-semibold mb-2 mt-3 text-gray-900 [&]:!text-gray-900"
  }

  if (level === 2) {
    return (
      <Tag
        id={headingId}
        className={headingStyles[2]}
        style={{color: '#111827 !important'}}
      >
        {children}
      </Tag>
    )
  }

  if (level === 3) {
    return (
      <Tag
        id={headingId}
        className={headingStyles[3]}
        style={{color: '#111827 !important'}}
      >
        {children}
      </Tag>
    )
  }

  return (
    <Tag
      id={headingId}
      className={headingStyles[level as keyof typeof headingStyles] || headingStyles[2]}
      style={{color: '#111827 !important'}}
    >
      {children}
    </Tag>
  )
}

// カスタムリストコンポーネント
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomList(props: any) {
  const type = props.value?.listItem || 'bullet'
  const Tag = type === 'number' ? 'ol' : 'ul'
  const listClass = type === 'number'
    ? "list-decimal list-inside mb-6 space-y-2 text-gray-900 [&]:!text-gray-900"
    : "list-disc list-inside mb-6 space-y-2 text-gray-900 [&]:!text-gray-900"

  return (
    <Tag className={listClass} style={{color: '#111827 !important'}}>
      {props.children}
    </Tag>
  )
}

// カスタムリストアイテムコンポーネント
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomListItem(props: any) {
  return (
    <li className="ml-4 text-gray-900 [&]:!text-gray-900" style={{color: '#111827 !important'}}>
      {props.children}
    </li>
  )
}

// カスタム強調コンポーネント
function CustomStrong({ children }: { children: React.ReactNode }) {
  return (
    <strong className="font-semibold text-gray-900 [&]:!text-gray-900" style={{color: '#111827 !important'}}>
      {children}
    </strong>
  )
}

// カスタム斜体コンポーネント
function CustomEm({ children }: { children: React.ReactNode }) {
  return (
    <em className="italic text-gray-900 [&]:!text-gray-900" style={{color: '#111827 !important'}}>
      {children}
    </em>
  )
}

// PortableTextのカスタムコンポーネント設定
export const portableTextComponents: PortableTextComponents = {
  // ブロックレベル要素
  block: {
    normal: CustomParagraph,
    h1: ({ children, value }) => <CustomHeading level={1} value={value}>{children}</CustomHeading>,
    h2: ({ children, value }) => <CustomHeading level={2} value={value}>{children}</CustomHeading>,
    h3: ({ children, value }) => <CustomHeading level={3} value={value}>{children}</CustomHeading>,
    h4: ({ children, value }) => <CustomHeading level={4} value={value}>{children}</CustomHeading>,
    h5: ({ children, value }) => <CustomHeading level={5} value={value}>{children}</CustomHeading>,
    h6: ({ children, value }) => <CustomHeading level={6} value={value}>{children}</CustomHeading>,
  },
  
  // リスト
  list: {
    bullet: CustomList,
    number: ({ children }) => <CustomList type="number">{children}</CustomList>,
  },
  
  listItem: {
    bullet: CustomListItem,
    number: CustomListItem,
  },
  
  // マーク（インライン要素）
  marks: {
    // リンク（これが最重要機能）
    link: CustomLink,
    
    // テキスト装飾
    strong: CustomStrong,
    em: CustomEm,
    
    // 将来の拡張用：カスタムマーク
    highlight: ({ children }) => (
      <mark className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
        {children}
      </mark>
    ),
    
    code: ({ children }) => (
      <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    ),
  },
  
  // 将来の拡張用：カスタムタイプ
  types: {
    // 画像やその他のメディアタイプをここに追加可能
  },
}

export default portableTextComponents