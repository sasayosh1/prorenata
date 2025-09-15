import { createClient } from 'next-sanity'
import Link from 'next/link'
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import ArticleWithTOC from '@/components/ArticleWithTOC'
import Header from '@/components/Header'

const projectId = '72m8vhy2'
const dataset = 'production'
const apiVersion = '2024-01-01'
const token = process.env.SANITY_API_TOKEN

function createSanityClient(isDraftMode = false) {
  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: !isDraftMode,
    token: isDraftMode ? token : undefined,
    perspective: isDraftMode ? 'previewDrafts' : 'published',
  })
}

export async function generateStaticParams() {
  const client = createSanityClient()
  const query = `*[_type == "post" && defined(slug.current)]{ "slug": slug.current }`
  const slugs: { slug: string }[] = await client.fetch(query)
  return slugs.map((s: { slug: string }) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const client = createSanityClient()
  const query = `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    excerpt,
    publishedAt,
    _updatedAt,
    slug,
    metaTitle,
    metaDescription,
    focusKeyword,
    relatedKeywords,
    featured,
    readingTime,
    "categories": categories[]->title,
    "author": author->{name}
  }`
  
  try {
    const post = await client.fetch(query, { slug: resolvedParams.slug })
    
    if (!post) {
      return {
        title: '記事が見つかりません | ProReNata',
        description: 'お探しの記事は存在しないか、削除された可能性があります。',
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://prorenata.jp'
    const canonicalUrl = `${baseUrl}/posts/${post.slug.current}`
    
    const title = post.metaTitle || `${post.title} | ProReNata`
    const description = post.metaDescription || 
      post.excerpt || 
      `${post.title}について、看護助手として働く皆様のお役に立つ情報をお届けします。`
    
    const keywords = [
      post.focusKeyword,
      ...(post.relatedKeywords || []),
      ...(post.categories || []),
      '看護助手',
      'ProReNata'
    ].filter(Boolean)

    return {
      title,
      description,
      keywords: keywords.join(', '),
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: 'ProReNata',
        locale: 'ja_JP',
        type: 'article',
        publishedTime: post.publishedAt,
        modifiedTime: post._updatedAt || post.publishedAt,
        authors: post.author?.name ? [post.author.name] : ['ProReNata編集部'],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
    }
  } catch (error) {
    console.error('メタデータ生成エラー:', error)
    return {
      title: 'エラー | ProReNata',
      description: '記事の読み込み中にエラーが発生しました。',
    }
  }
}

interface PostPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const resolvedParams = await params
  const isDraftMode = (await draftMode()).isEnabled
  const client = createSanityClient(isDraftMode)
  
  const query = `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    publishedAt,
    _updatedAt,
    excerpt,
    body,
    focusKeyword,
    relatedKeywords,
    readingTime,
    contentType,
    tags,
    "categories": categories[]->title,
    "author": author->{name, slug}
  }`
  const post = await client.fetch(query, { slug: resolvedParams.slug })

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
        <div className="flex h-screen flex-col justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-bold leading-9 tracking-tight text-gray-900 md:text-8xl md:leading-14">
              404
            </h1>
            <p className="text-xl leading-normal text-gray-600 md:text-2xl">
              記事が見つかりません
            </p>
            <p className="mb-4 text-xl leading-normal text-gray-600 md:text-2xl">
              お探しの記事は存在しないか、削除された可能性があります。
            </p>
            <Link
              href="/"
              className="inline rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium leading-5 text-white shadow transition-colors duration-150 hover:bg-blue-700 focus:outline-none focus:shadow-outline-blue"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Preview Mode Banner */}
      {isDraftMode && (
        <div className="fixed top-0 left-0 z-50 w-full bg-yellow-50 px-6 py-2 text-center text-sm font-medium text-yellow-800 border-b border-yellow-200">
          🔍 プレビューモード中 -
          <Link href="/api/preview?disable=true" className="underline ml-2 hover:text-yellow-600">
            プレビューを終了
          </Link>
        </div>
      )}

      <Header />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
        <main>
            <div className="xl:divide-y xl:divide-gray-200">
              <header className="pt-6 xl:pb-6">
                <div className="space-y-1 text-center">
                  <dl className="space-y-10">
                    <div>
                      <dt className="sr-only">Published on</dt>
                      <dd className="text-base font-medium leading-6 text-gray-500">
                        <time dateTime={post.publishedAt}>
                          {new Date(post.publishedAt).toLocaleDateString('ja-JP', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </time>
                      </dd>
                    </div>
                  </dl>
                  <div>
                    <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-5xl md:leading-14">
                      {post.title}
                    </h1>
                  </div>
                </div>
              </header>
              <div className="divide-y divide-gray-200 pb-8 xl:grid xl:grid-cols-4 xl:gap-x-6 xl:divide-y-0">
                <dl className="pb-10 pt-6 xl:border-b xl:border-gray-200 xl:pt-11">
                  <dt className="sr-only">Authors</dt>
                  <dd>
                    <ul className="flex flex-wrap justify-center gap-4 sm:space-x-12 xl:block xl:space-x-0 xl:space-y-8">
                      <li className="flex items-center space-x-2">
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {post.author?.name?.charAt(0) || 'P'}
                          </span>
                        </div>
                        <dl className="whitespace-nowrap text-sm font-medium leading-5">
                          <dt className="sr-only">Name</dt>
                          <dd className="text-gray-900">
                            {post.author?.name || 'ProReNata編集部'}
                          </dd>
                        </dl>
                      </li>
                    </ul>
                  </dd>
                </dl>
                <div className="divide-y divide-gray-200 xl:col-span-3 xl:row-span-2 xl:pb-0">
                  <div className="max-w-none pb-8 pt-10" style={{color: 'black !important'}}>
                    {/* 記事コンテンツと目次 */}
                    {post.body && <ArticleWithTOC content={post.body} />}
                  </div>
                </div>
                <footer>
                  <div className="divide-gray-200 text-sm font-medium leading-5 xl:col-start-1 xl:row-start-2 xl:divide-y">
                    {post.categories && (
                      <div className="py-4 xl:py-8">
                        <h2 className="text-xs uppercase tracking-wide text-gray-500">
                          カテゴリ
                        </h2>
                        <div className="flex flex-wrap">
                          {post.categories.map((category: string, index: number) => (
                            <span
                              key={index}
                              className="mr-3 text-sm font-medium uppercase text-cyan-600 hover:text-cyan-700"
                            >
                              {typeof category === 'string' ? category : category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between py-4 xl:block xl:space-y-8 xl:py-8">
                      <div>
                        <h2 className="text-xs uppercase tracking-wide text-gray-500">
                          前の記事
                        </h2>
                        <div className="text-cyan-600 hover:text-cyan-700">
                          <Link href="/">記事一覧に戻る</Link>
                        </div>
                      </div>
                      <div>
                        <h2 className="text-xs uppercase tracking-wide text-gray-500">
                          次の記事
                        </h2>
                        <div className="text-cyan-600 hover:text-cyan-700">
                          <Link href="/">記事一覧に戻る</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 xl:pt-8">
                    <Link
                      href="/"
                      className="text-cyan-600 hover:text-cyan-700"
                      aria-label="記事一覧に戻る"
                    >
                      &larr; 記事一覧に戻る
                    </Link>
                  </div>
                </footer>
              </div>
            </div>
        </main>
      </div>
    </>
  )
}