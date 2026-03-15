import React from 'react'
import Link from 'next/link'
import { PortableTextComponents, PortableTextComponentProps } from '@portabletext/react'
import { PortableTextBlock } from '@portabletext/types'
import { sanitizeTitle } from '@/lib/title'
import type { RelatedPostSummary } from '@/lib/sanity'
import SpeechBubble from './SpeechBubble'
import DisclaimerCallout from './Article/DisclaimerCallout'

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
    /moshimo\.com/i,                          // もしもアフィリエイト
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
        bg: '',
        text: 'text-[#007185] hover:underline', // Amazon Color
        icon: '🛒',
      },
      rakuten: {
        bg: '',
        text: 'text-[#bf0000] hover:underline', // Rakuten Color
        icon: '🛍️',
      },
      other: {
        bg: '',
        text: 'text-blue-600 hover:underline',
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
          inline-flex items-center gap-1 font-semibold
          ${style.text}
          transition-opacity duration-200 hover:opacity-80
          no-underline mx-1
        `}
      >
        <span>{style.icon}</span>
        <span className="underline decoration-dotted decoration-2 underline-offset-4">{children}</span>
      </a>
    )
  }

  // 内部リンクで新しいタブで開かない場合はNext.js Linkを使用
  if (!shouldOpenInNewTab && !isExternal) {
    return (
      <Link
        href={href}
        className="inline-block px-1 text-blue-600 hover:text-blue-800 underline transition-colors duration-200"
      >
        {children}
      </Link>
    )
  }

  // 通常の外部リンク
  if (isAffiliate) {
    return (
      <a
        href={href}
        target={shouldOpenInNewTab ? "_blank" : undefined}
        rel={shouldOpenInNewTab ? "noopener noreferrer" : undefined}
        className="inline-block px-1 text-blue-600 hover:text-blue-800 underline transition-colors duration-200"
        data-external={isExternal}
        data-affiliate={isAffiliate}
        data-new-tab={shouldOpenInNewTab}
        data-affiliate-link="true"
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
      </a>
    )
  }

  return (
    <a
      href={href}
      target={shouldOpenInNewTab ? "_blank" : undefined}
      rel={shouldOpenInNewTab ? "noopener noreferrer" : undefined}
      className="text-blue-600 hover:text-blue-800 underline transition-colors duration-200"
      data-external={isExternal}
      data-new-tab={shouldOpenInNewTab}
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
    </a>
  )
}

// カスタム段落コンポーネント（リンクが含まれる可能性があるため）
function CustomParagraph({ children, value }: PortableTextComponentProps<PortableTextBlock>) {
  const inlineAffiliateType = getInlineAffiliateType(value)
  const isAffiliatePrBlock = isAffiliatePrParagraph(value)
  const hasInternalLink = containsInternalLink(value) && !inlineAffiliateType
  const isStandaloneInternalLink = isStandaloneInternalLinkParagraph(value)
  const plainText = extractPlainText(value)
  const sanitizedText = sanitizeSummaryText(plainText)

  let paragraphClass = 'leading-relaxed text-gray-800 [&]:!text-gray-800'
  if (inlineAffiliateType || isAffiliatePrBlock) {
    if (inlineAffiliateType === 'cta') {
      // アフィリエイトCTAテキストは通常のスタイルで表示（背景色なし）
      paragraphClass = `leading-relaxed text-gray-800 [&]:!text-gray-800 mb-2 mt-6`
    } else if (inlineAffiliateType === 'link' || isAffiliatePrBlock) {
      // [PR]リンクは薄いブルーの背景色で表示（枠線なし）
      paragraphClass = `leading-relaxed text-gray-800 bg-[#EFF6FF] rounded-lg px-4 py-3 text-sm mb-6`
    }
  } else if (hasInternalLink) {
    // 内部リンク段落は装飾（背景/枠）を付けない（ユーザビリティ優先）
    paragraphClass = `${paragraphClass} ${isStandaloneInternalLink ? 'mb-8' : 'mb-6'}`
  } else {
    paragraphClass = `${paragraphClass} mb-6`
  }

  if (isReferenceBlock(value)) {
    const reference = extractReferenceInfo(value)
    return (
      <p className={paragraphClass} style={{ color: 'rgb(31, 41, 55) !important' }}>
        <span>参考: </span>
        {reference.url ? (
          <a
            href={reference.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {reference.label}
          </a>
        ) : (
          <span>{reference.label}</span>
        )}
      </p>
    )
  }

  if (isDisclaimerBlock(value)) {
    return (
      <p className="mb-6 rounded-md border border-[#F0E6AA] bg-white px-4 py-3 text-[13px] leading-relaxed text-[#555]" style={{ color: '#555 !important' }}>
        {children}
      </p>
    )
  }

  return (
    <p className={paragraphClass} style={{ color: 'rgb(31, 41, 55) !important' }}>
      {sanitizedText !== plainText ? sanitizedText : children}
    </p>
  )
}

function isReferenceBlock(value?: PortableTextBlock) {
  if (!value || !Array.isArray(value.children)) return false
  const firstChildText = value.children[0]?.text?.trim()
  return firstChildText?.startsWith('参考')
}

function containsInternalLink(value?: PortableTextBlock) {
  if (!value || !Array.isArray(value.markDefs)) return false
  return value.markDefs.some(
    def => def?._type === 'link' && typeof def.href === 'string' && def.href.startsWith('/posts')
  )
}

function isStandaloneInternalLinkParagraph(value?: PortableTextBlock) {
  if (!value || !Array.isArray(value.children) || !Array.isArray(value.markDefs)) return false

  const internalLinkKeys = new Set(
    value.markDefs
      .filter(
        def => def?._type === 'link' && typeof def.href === 'string' && def.href.startsWith('/posts') && def._key
      )
      .map(def => def._key as string)
  )

  if (internalLinkKeys.size === 0) return false

  return value.children.every(child => {
    const text = (child as { text?: string }).text?.trim() ?? ''
    if (!text) return true
    const marks = (child as { marks?: string[] }).marks
    return Array.isArray(marks) && marks.some(mark => internalLinkKeys.has(mark))
  })
}

function getInlineAffiliateType(value?: PortableTextBlock) {
  if (!value || !value._key) return null
  const key = value._key.toString()
  if (key.startsWith('inline-cta-')) return 'cta'
  if (key.startsWith('inline-link-')) return 'link'
  return null
}

function isAffiliatePrParagraph(value?: PortableTextBlock) {
  if (!value || !Array.isArray(value.children)) return false
  const firstChildText = value.children[0]?.text?.trim()
  return typeof firstChildText === 'string' && firstChildText.startsWith('[PR]')
}

function isDisclaimerBlock(value?: PortableTextBlock) {
  if (!value || !Array.isArray(value.children)) return false
  const firstChildText = value.children[0]?.text?.trim()
  return firstChildText?.startsWith('免責事項')
}

function extractReferenceInfo(value?: PortableTextBlock) {
  if (!value) return { label: '', url: '' }

  const linkSpan = value.children?.find(
    (child) => Array.isArray((child as { marks?: string[] }).marks) && (child as { marks?: string[] }).marks?.length
  ) as { text?: string; marks?: string[] } | undefined

  const markKey = linkSpan?.marks?.[0]
  const markDef = value.markDefs?.find((mark) => mark._key === markKey) as { href?: string } | undefined

  return {
    label: linkSpan?.text || '',
    url: markDef?.href || '',
  }
}

function extractPlainText(value?: PortableTextBlock) {
  if (!value || !Array.isArray(value.children)) return ''
  return value.children
    .map((child) => (typeof (child as { text?: string }).text === 'string' ? (child as { text?: string }).text : ''))
    .join('')
    .trim()
}

function sanitizeSummaryText(text: string): string {
  if (!text) return text

  let result = text

  // 先頭の【…】は基本的に残す（例: 【2026年診療報酬改定】）
  // ただし、ペルソナ/PRなどのノイズは除去
  result = result.replace(/^【([^】]*)】\s*/u, (full, inner) => {
    const t = String(inner || '')
    if (/(PR|広告|看護助手|セラ|白崎セラ)/i.test(t)) return ''
    return full
  })

  // タイトルをそのまま使ったテンプレはタイトル部を除去
  result = sanitizeTitle(result)

  // 「～を徹底解説でお伝えした内容を振り返ると」系の定型文を短く置き換える
  if (/徹底解説でお伝えした内容を振り返ると/.test(result)) {
    result = 'この記事で取り上げたポイントを、無理なく実践しやすいところから試してみましょう。'
  }

  return result.trim()
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
    2: "text-2xl font-bold mb-6 mt-8 text-gray-800 [&]:!text-gray-800 border-2 border-gray-600 px-4 py-3",
    3: "text-xl font-semibold mb-4 mt-6 text-gray-800 [&]:!text-gray-800",
    4: "text-lg font-semibold mb-3 mt-5 text-gray-800 [&]:!text-gray-800",
    5: "text-base font-semibold mb-2 mt-4 text-gray-800 [&]:!text-gray-800",
    6: "text-sm font-semibold mb-2 mt-3 text-gray-800 [&]:!text-gray-800"
  }

  if (level === 2) {
    return (
      <Tag
        id={headingId}
        className={headingStyles[2]}
        style={{ color: 'rgb(31, 41, 55) !important' }}
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
        style={{ color: 'rgb(31, 41, 55) !important' }}
      >
        {children}
      </Tag>
    )
  }

  return (
    <Tag
      id={headingId}
      className={headingStyles[level as keyof typeof headingStyles] || headingStyles[2]}
      style={{ color: 'rgb(31, 41, 55) !important' }}
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
    ? "list-decimal list-outside pl-6 mb-6 space-y-2 text-gray-800 [&]:!text-gray-800"
    : "list-disc list-outside pl-6 mb-6 space-y-2 text-gray-800 [&]:!text-gray-800"

  return (
    <Tag className={listClass} style={{ color: 'rgb(31, 41, 55) !important' }}>
      {props.children}
    </Tag>
  )
}

// カスタムリストアイテムコンポーネント
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomListItem(props: any) {
  return (
    <li
      className="text-gray-800 [&]:!text-gray-800 [&>p]:inline [&>p]:m-0"
      style={{ color: 'rgb(31, 41, 55) !important' }}
    >
      {props.children}
    </li>
  )
}

// カスタム強調コンポーネント
function CustomStrong({ children }: { children: React.ReactNode }) {
  return (
    <strong className="font-semibold text-gray-800 [&]:!text-gray-800" style={{ color: 'rgb(31, 41, 55) !important' }}>
      {children}
    </strong>
  )
}

// カスタム斜体コンポーネント
function CustomEm({ children }: { children: React.ReactNode }) {
  return (
    <em className="italic text-gray-800 [&]:!text-gray-800" style={{ color: 'rgb(31, 41, 55) !important' }}>
      {children}
    </em>
  )
}

// PortableTextのカスタムコンポーネント設定
export const portableTextComponents: PortableTextComponents = {
  // ブロックレベル要素
  block: {
    normal: CustomParagraph,
    callout: ({ children }) => (
      <div className="my-6 rounded-lg border border-cyan-100 bg-cyan-50/70 px-5 py-4 text-sm text-slate-700 [&]:!text-slate-700">
        <p className="m-0 whitespace-pre-line">{children}</p>
      </div>
    ),
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
    // リンクはCustomLinkコンポーネントでレンダリング（アフィリエイトリンクにPR表示）
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
    disclaimerCallout: ({ value }: { value?: { blocks?: PortableTextBlock[] } }) => (
      <DisclaimerCallout blocks={value?.blocks} />
    ),
    relatedPosts: ({ value }: { value?: { posts?: RelatedPostSummary[] } }) => {
      const posts = Array.isArray(value?.posts) ? value.posts : []

      return (
        <section className="mt-12 pt-8 border-t border-gray-200" aria-label="あわせて読みたい">
          <h3 className="text-2xl font-bold mb-6 text-gray-800">あわせて読みたい</h3>
          {posts.length > 0 ? (
            <ul className="space-y-3">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/posts/${post.slug}`}
                    className="text-lg text-cyan-700 hover:text-cyan-900 font-semibold transition-colors duration-200"
                  >
                    {sanitizeTitle(post.title)}
                  </Link>
                  {post.categories && post.categories.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-2 text-sm text-gray-600">
                      {post.categories.slice(0, 2).map((category, idx) => {
                        const key = category.slug || `${category.title}-${idx}`
                        if (category.slug) {
                          return (
                            <Link
                              key={key}
                              href={`/categories/${category.slug}`}
                              className="underline decoration-dotted hover:text-cyan-700"
                            >
                              {category.title}
                            </Link>
                          )
                        }
                        return (
                          <span key={key} className="text-gray-600">
                            {category.title}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-600">
              <Link href="/posts" className="underline decoration-dotted hover:text-cyan-700">
                記事一覧
              </Link>
              から気になるテーマを探してみてください。
            </div>
          )}
        </section>
      )
    },
    image: ({ value }: { value: { asset: { _ref: string }; alt?: string } }) => {
      if (!value?.asset?._ref) {
        return null
      }

      // Sanity画像URLを生成
      const imageUrl = `https://cdn.sanity.io/images/72m8vhy2/production/${value.asset._ref.replace('image-', '').replace(/-([a-z]+)$/, '.$1')}`

      return (
        <figure className="my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={value.alt || ''}
            className="w-full h-auto rounded-lg shadow-md"
            loading="lazy"
          />
          {value.alt && (
            <figcaption className="mt-2 text-sm text-center text-gray-600">
              {value.alt}
            </figcaption>
          )}
        </figure>
      )
    },
    affiliateEmbed: ({ value }: { value?: { provider?: string; html?: string; label?: string } }) => {
      if (!value?.html) return null

      return (
        <div
          className="my-6 text-gray-800"
          data-provider={value.provider || 'affiliate'}
          dangerouslySetInnerHTML={{ __html: value.html }}
        />
      )
    },
    speechBubble: SpeechBubble,
  },
}

export default portableTextComponents
