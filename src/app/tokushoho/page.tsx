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

          <table>
            <tbody>
              <tr>
                <th>販売業者</th>
                <td>佐々木善正</td>
              </tr>
              <tr>
                <th>所在地</th>
                <td>請求があれば遅滞なく開示します</td>
              </tr>
              <tr>
                <th>電話番号</th>
                <td>請求があれば遅滞なく開示します</td>
              </tr>
              <tr>
                <th>メールアドレス</th>
                <td><a href="mailto:prorenata.jp@gmail.com">prorenata.jp@gmail.com</a></td>
              </tr>
              <tr>
                <th>運営サイト</th>
                <td><a href="https://prorenata.jp" target="_blank" rel="noopener noreferrer">https://prorenata.jp</a></td>
              </tr>
              <tr>
                <th>販売価格</th>
                <td>当サイトは情報提供を目的としたメディアサイトです。商品・サービスの価格は各提携先サイトに準じます。</td>
              </tr>
              <tr>
                <th>商品代金以外の費用</th>
                <td>なし（通信費・接続料はお客様のご負担となります）</td>
              </tr>
              <tr>
                <th>支払方法</th>
                <td>各提携先サイトの規定に準じます</td>
              </tr>
              <tr>
                <th>引渡し時期</th>
                <td>各提携先サイトの規定に準じます</td>
              </tr>
              <tr>
                <th>返品・キャンセル</th>
                <td>各提携先サイトの規定に準じます。当サイト経由での購入・申込みに関するキャンセル・返品は各提携先にお問い合わせください。</td>
              </tr>
            </tbody>
          </table>

          <p className="text-sm text-gray-500">制定日: 2026年4月8日</p>
        </article>
      </div>
      <Footer />
    </>
  )
}
