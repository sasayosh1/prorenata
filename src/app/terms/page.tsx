import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: '利用規約 | ProReNata',
  description: 'ProReNataの利用規約。サービスのご利用にあたっての注意事項をご確認ください。',
}

export default function TermsPage() {
  return (
    <>
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 xl:max-w-5xl xl:px-0">
        <article className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 md:p-12 prose prose-blue max-w-none">
          <h1>利用規約</h1>
          <p>
            本規約は、ProReNata（以下「当サイト」）が提供するコンテンツおよびサービスの利用条件を定めるものです。
            当サイトをご利用いただく際は、本規約に同意いただいたものとみなします。
          </p>

          <h2>第1条（適用）</h2>
          <p>
            本規約は、利用者と当サイトとの間の一切の関係に適用されます。
          </p>

          <h2>第2条（禁止事項）</h2>
          <ul>
            <li>法令または公序良俗に反する行為</li>
            <li>他の利用者または第三者の権利を侵害する行為</li>
            <li>当サイトの運営を妨げる行為</li>
          </ul>

          <h2>第3条（免責事項）</h2>
          <p>
            当サイトのコンテンツは、看護助手の皆さまに役立つ情報提供を目的としていますが、利用により生じた損害については一切の責任を負いません。
            必要に応じて専門家にご相談ください。
          </p>

          <h2>第4条（著作権）</h2>
          <p>
            当サイトに掲載している文章、画像、その他のコンテンツの著作権は当サイトまたは正当な権利者に帰属します。無断転載を禁止します。
          </p>

          <h2>第5条（サービスの変更・停止）</h2>
          <p>
            当サイトは、事前の通知なくサービス内容の変更や一時停止を行うことがあります。
          </p>

          <h2>第6条（準拠法・管轄）</h2>
          <p>
            本規約は日本法に準拠します。当サイトに関する紛争は、当サイトの運営者所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
          </p>

          <p className="text-sm text-gray-500">制定日: 2025年10月1日</p>
        </article>
      </div>
      <Footer />
    </>
  )
}
