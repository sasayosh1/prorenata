import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getAllPosts, formatPostDate, type Post } from '@/lib/sanity'

export const metadata: Metadata = {
  title: 'サイトマップ | ProReNata',
  description: 'ProReNataのサイトマップ。主要なページと最新記事を一覧でご確認いただけます。',
}

export default async function HtmlSitemapPage() {
  let posts: Post[] = []
  try {
    posts = await getAllPosts({ fetchAll: true })
  } catch (error) {
    console.error('Failed to fetch posts for sitemap page:', error)
  }

  return (
    <>
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 xl:px-0">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">サイトマップ</h1>
          <p className="text-gray-600 mb-10">
            ProReNataの主要なページと最新記事へのリンク集です。目的の情報をすばやく見つける際にご利用ください。
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">主要ページ</h2>
            <ul className="space-y-2 text-blue-600">
              <li><Link href="/">ホーム</Link></li>
              <li><Link href="/posts">記事一覧</Link></li>
              <li><Link href="/search">記事検索</Link></li>
              <li><Link href="/nursing-assistant">看護助手ガイド</Link></li>
              <li><Link href="/community">コミュニティガイド</Link></li>
              <li><Link href="/tags">タグ一覧</Link></li>
              <li><Link href="/categories">カテゴリー一覧</Link></li>
              <li><Link href="/about">当サイトについて</Link></li>
              <li><Link href="/contact">お問い合わせ</Link></li>
              <li><Link href="/privacy">プライバシーポリシー</Link></li>
              <li><Link href="/terms">利用規約</Link></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">最新記事</h2>
            {posts.length === 0 ? (
              <p className="text-gray-600">記事を読み込んでいます...</p>
            ) : (
              <ul className="space-y-3">
                {posts.slice(0, 50).map((post) => {
                  const { label } = formatPostDate(post)
                  return (
                    <li key={post._id}>
                      <a
                        href={`/posts/${post.slug.current}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {post.title}
                      </a>
                      <span className="ml-2 text-sm text-gray-500">{label}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
      <Footer />
    </>
  )
}
