import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: '特定商取引法に基づく表記 | ProReNata',
  description: 'ProReNataの特定商取引法に基づく表記ページです。',
}

export default function TokushohoPage() {
  return (
    <>
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 xl:max-w-5xl xl:px-0">
        <article className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 md:p-12 prose prose-blue max-w-none">
          <h1>特定商取引法に基づく表記</h1>

          <h2>■運営者</h2>
          <p>ProReNata</p>

          <h2>■サイトURL</h2>
          <p><a href="https://prorenata.jp" target="_blank" rel="noopener noreferrer">https://prorenata.jp</a></p>

          <h2>■販売業者</h2>
          <p><strong>【当サイトが販売する商品】</strong><br />
          ProReNata（LINEスタンプ・Kindle書籍などのデジタルコンテンツ）</p>
          <p><strong>【アフィリエイト商品】</strong><br />
          各販売元に準じます</p>

          <h2>■販売価格</h2>
          <p><strong>【当サイト商品】</strong><br />
          各販売ページに記載</p>
          <p><strong>【アフィリエイト商品】</strong><br />
          各販売元の表示に準じます</p>

          <h2>■商品代金以外の必要料金</h2>
          <p>インターネット接続料金等はお客様のご負担となります</p>

          <h2>■支払方法</h2>
          <p><strong>【当サイト商品】</strong><br />
          各プラットフォーム（LINE STORE・Amazon等）の決済方法に準じます</p>
          <p><strong>【アフィリエイト商品】</strong><br />
          各販売元の規定に準じます</p>

          <h2>■商品の引渡し時期</h2>
          <p><strong>【当サイト商品】</strong><br />
          決済完了後、各プラットフォームの仕様に基づき提供されます</p>
          <p><strong>【アフィリエイト商品】</strong><br />
          各販売元の規定に準じます</p>

          <h2>■返品・キャンセル</h2>
          <p><strong>【当サイト商品】</strong><br />
          デジタルコンテンツの性質上、原則として返品・返金はお受けできません</p>
          <p><strong>【アフィリエイト商品】</strong><br />
          各販売元の規定に準じます</p>

          <h2>■お問い合わせ</h2>
          <p><a href="mailto:prorenata.jp@gmail.com">prorenata.jp@gmail.com</a></p>

          <p className="text-sm text-gray-500">
            ※当サイトはアフィリエイトプログラムを利用し商品を紹介しています。<br />
            実際の販売契約はリンク先の各販売元との間で行われます。
          </p>

          <p className="text-sm text-gray-500">制定日: 2026年4月8日</p>
        </article>
      </div>
      <Footer />
    </>
  )
}
