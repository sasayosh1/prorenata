import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import MedicalTermQuiz from '@/components/MedicalTermQuiz'

export const metadata: Metadata = {
  title: 'メディカルクイズ | ProReNata',
  description: '看護助手に必要な医療知識を楽しく学べるクイズです。毎日続けて、現場で使える知識を身につけましょう。',
}

export default function QuizPage() {
  return (
    <>
      <Header />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
        <main>
          <div className="divide-y divide-gray-200">
            <div className="space-y-2 pb-8 pt-6 md:space-y-5">
              {/* パンくずナビゲーション */}
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                <Link href="/" className="hover:text-cyan-600 transition-colors duration-200">
                  ホーム
                </Link>
                <span className="text-gray-300">/</span>
                <span className="text-gray-900 font-medium">メディカルクイズ</span>
              </nav>

              <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
                メディカルクイズ
              </h1>
              <p className="text-lg leading-7 text-gray-500">
                看護助手に必要な医療知識を3択クイズで学びましょう
              </p>
            </div>

            <div className="pt-8 pb-8">
              <MedicalTermQuiz />
            </div>

            <div className="pt-8 pb-8 prose max-w-none text-gray-900">
              <h2>クイズについて</h2>
              <p>
                このクイズでは、看護助手として働く上で必要な医療知識を学ぶことができます。
                バイタルサイン、薬剤、解剖、医療器具、処置・ケアの5つのカテゴリーから出題されます。
              </p>
              <p>
                毎日少しずつ問題を解いて、現場で使える知識を身につけましょう。
                正解率や連続正解数は自動的に記録されるので、学習の進捗を確認できます。
              </p>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
