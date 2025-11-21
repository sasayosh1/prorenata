import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import RankingsDisplay from '@/components/RankingsDisplay'

export const metadata: Metadata = {
  title: 'クイズランキング | ProReNata',
  description: '医療用語クイズのランキングページです。週間・月間のトップスコアを確認できます。',
}

export default function RankingsPage() {
  return (
    <>
      <Header />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 xl:px-0 py-8">
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-gray-700">ホーム</Link>
          <span>/</span>
          <Link href="/quiz" className="hover:text-gray-700">医療用語クイズ</Link>
          <span>/</span>
          <span>ランキング</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">クイズランキング</h1>

        <RankingsDisplay />

        <div className="mt-10 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition-colors duration-200 hover:border-cyan-300 hover:text-cyan-700"
          >
            ホームに戻る
            <span aria-hidden="true">↩︎</span>
          </Link>
        </div>
      </div>
      <Footer />
    </>
  )
}
