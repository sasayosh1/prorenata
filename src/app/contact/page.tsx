import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'お問い合わせ | ProReNata',
  description: 'ProReNataへのお問い合わせはこちらから。看護助手として働く皆さまからのご質問・ご相談を受け付けています。',
}

export default function ContactPage() {
  return (
    <>
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 xl:max-w-5xl xl:px-0">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">お問い合わせ</h1>
          <p className="text-gray-600 leading-relaxed mb-8">
            ProReNataでは、看護助手として働く皆さまからのご質問・ご相談を受け付けています。
            サイトに関するご意見や取材のご依頼、広告掲載についてなど、お気軽にご連絡ください。
          </p>

          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">メールでのお問い合わせ</h2>
              <p className="text-gray-600">
                下記のメールアドレス宛にご連絡ください。
              </p>
              <a
                href="mailto:info@prorenata.jp"
                className="mt-3 inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                info@prorenata.jp
              </a>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">SNS</h2>
              <p className="text-gray-600">
                最新情報は公式X（旧Twitter）でも発信しています。DMでのご連絡も可能です。
              </p>
              <a
                href="https://twitter.com/prorenata_jp"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                @prorenata_jp
              </a>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">対応時間</h2>
              <p className="text-gray-600">
                平日 10:00 〜 18:00（祝日を除く）
              </p>
              <p className="text-sm text-gray-500 mt-1">
                ※内容によっては返信にお時間をいただく場合がございます。ご了承ください。
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
