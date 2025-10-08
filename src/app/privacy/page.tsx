import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'プライバシーポリシー | ProReNata',
  description: 'ProReNataのプライバシーポリシー。個人情報の取り扱いについてご案内します。',
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 xl:max-w-5xl xl:px-0">
        <article className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 md:p-12 prose prose-blue max-w-none">
          <h1>プライバシーポリシー</h1>
          <p>
            ProReNata（以下「当サイト」）では、お客様の個人情報を適切に取り扱い、安心してご利用いただけるよう努めています。
            本ポリシーでは、当サイトが収集する情報、その利用目的、管理方法について説明します。
          </p>

          <h2>1. 収集する情報</h2>
          <ul>
            <li>お問い合わせフォームから送信された氏名・メールアドレス・ご相談内容</li>
            <li>アクセス解析のために利用するクッキー情報</li>
            <li>広告配信のための匿名の行動データ</li>
          </ul>

          <h2>2. 利用目的</h2>
          <ul>
            <li>お問い合わせへの回答および必要な情報提供のため</li>
            <li>コンテンツの改善、サービス品質向上のための分析</li>
            <li>不正アクセス防止やセキュリティ対策のため</li>
          </ul>

          <h2>3. 情報の共有</h2>
          <p>
            法令に基づく場合を除き、取得した個人情報を第三者に提供することはありません。
            解析ツールや広告配信サービスに対しては、匿名化されたデータのみを共有します。
          </p>

          <h2>4. アクセス解析ツールの利用</h2>
          <p>
            当サイトでは Google Analytics を利用しています。収集されるデータは匿名であり、個人を特定するものではありません。
            詳細は <a href="https://marketingplatform.google.com/about/analytics/terms/jp/" target="_blank" rel="noopener noreferrer">Google Analytics 利用規約</a> をご確認ください。
          </p>

          <h2>5. クッキー（Cookie）の利用について</h2>
          <p>
            ブラウザの設定によりクッキーを無効化することが可能ですが、その場合一部機能をご利用いただけない場合があります。
          </p>

          <h2>6. 個人情報の開示・訂正・削除</h2>
          <p>
            ご本人からのご要望があった場合、速やかに対応いたします。<a href="mailto:info@prorenata.jp">info@prorenata.jp</a> までご連絡ください。
          </p>

          <h2>7. ポリシーの改定</h2>
          <p>
            必要に応じて本ポリシーを改定する場合があります。更新内容は本ページでお知らせします。
          </p>

          <p className="text-sm text-gray-500">制定日: 2025年10月1日</p>
        </article>
      </div>
      <Footer />
    </>
  )
}
