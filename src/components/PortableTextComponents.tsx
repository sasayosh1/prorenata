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
  
  // 新しいタブで開くかどうかの判定
  // 1. Sanityで明示的に設定された場合はそれを優先
  // 2. 設定がない場合は、外部リンクなら新しいタブで開く
  const shouldOpenInNewTab = openInNewTab !== undefined ? openInNewTab : isExternal
  
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
  
  // 新しいタブで開く場合（外部リンクまたは明示的に設定された場合）
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
      // アフィリエイトリンクの場合は専用の属性を追加
      {...(isAffiliate && { 'data-affiliate-link': 'true' })}
    >
      {children}
      {/* リンクの種類に応じてアイコンを表示 */}
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
    <p className="mb-6 leading-relaxed text-black dark:text-gray-200" style={{color: 'black !important'}}>
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
  value?: {
    children?: Array<{
      _type: string
      text?: string
      [key: string]: unknown
    }>
    [key: string]: unknown
  }
}) {
  const Tag = `h${Math.max(2, Math.min(6, level + 1))}` as keyof React.JSX.IntrinsicElements
  
  // 見出しテキストからIDを生成
  const headingText = value?.children
    ?.filter((child) => child._type === 'span')
    ?.map((child) => child.text)
    ?.join(' ') || ''
  
  const headingId = headingText
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
  
  const headingStyles = {
    2: "text-2xl font-bold mb-6 mt-8 text-black dark:text-gray-100 border-2 border-gray-600 px-4 py-3",
    3: "text-xl font-semibold mb-4 mt-6 text-black dark:text-gray-100", 
    4: "text-lg font-semibold mb-3 mt-5 text-black dark:text-gray-100",
    5: "text-base font-semibold mb-2 mt-4 text-black dark:text-gray-100",
    6: "text-sm font-semibold mb-2 mt-3 text-black dark:text-gray-100"
  }
  
  if (level === 2) {
    return (
      <Tag 
        id={headingId} 
        className={headingStyles[2]} 
        style={{color: 'black !important'}}
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
        style={{color: 'black !important'}}
      >
        {children}
      </Tag>
    )
  }
  
  return (
    <Tag 
      id={headingId} 
      className={headingStyles[level as keyof typeof headingStyles] || headingStyles[2]} 
      style={{color: 'black !important'}}
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
    ? "list-decimal list-inside mb-6 space-y-2 text-black dark:text-gray-200"
    : "list-disc list-inside mb-6 space-y-2 text-black dark:text-gray-200"
  
  return (
    <Tag className={listClass} style={{color: 'black !important'}}>
      {props.children}
    </Tag>
  )
}

// カスタムリストアイテムコンポーネント
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomListItem(props: any) {
  return (
    <li className="ml-4 text-black" style={{color: 'black !important'}}>
      {props.children}
    </li>
  )
}

// カスタム強調コンポーネント
function CustomStrong({ children }: { children: React.ReactNode }) {
  return (
    <strong className="font-semibold text-black dark:text-gray-100" style={{color: 'black !important'}}>
      {children}
    </strong>
  )
}

// カスタム斜体コンポーネント
function CustomEm({ children }: { children: React.ReactNode }) {
  return (
    <em className="italic text-black dark:text-gray-300" style={{color: 'black !important'}}>
      {children}
    </em>
  )
}

// PortableTextのカスタムコンポーネント設定
export const portableTextComponents: PortableTextComponents = {
  // ブロックレベル要素
  block: {
    normal: CustomParagraph,
    h1: ({ children, value }) => <CustomHeading level={1} value={value as Parameters<typeof CustomHeading>[0]['value']}>{children}</CustomHeading>,
    h2: ({ children, value }) => <CustomHeading level={2} value={value as Parameters<typeof CustomHeading>[0]['value']}>{children}</CustomHeading>,
    h3: ({ children, value }) => <CustomHeading level={3} value={value as Parameters<typeof CustomHeading>[0]['value']}>{children}</CustomHeading>,
    h4: ({ children, value }) => <CustomHeading level={4} value={value as Parameters<typeof CustomHeading>[0]['value']}>{children}</CustomHeading>,
    h5: ({ children, value }) => <CustomHeading level={5} value={value as Parameters<typeof CustomHeading>[0]['value']}>{children}</CustomHeading>,
    h6: ({ children, value }) => <CustomHeading level={6} value={value as Parameters<typeof CustomHeading>[0]['value']}>{children}</CustomHeading>,
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