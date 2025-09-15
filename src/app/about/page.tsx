import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function AboutPage() {
  return (
    <>
      <Header />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
        {/* Main Content */}
        <main>
          <div className="divide-y divide-gray-200">
            <div className="space-y-2 pb-8 pt-6 md:space-y-5">
              <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
                About ProReNata
              </h1>
              <p className="text-lg leading-7 text-gray-500">
                看護助手の皆様を応援する情報サイトについて
              </p>
            </div>
            
            <div className="prose max-w-none pt-8 pb-8 text-gray-900">
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold leading-8 tracking-tight text-gray-900 mb-4">
                    ProReNataとは
                  </h2>
                  <p className="text-lg leading-7 text-gray-700 mb-6">
                    ProReNata（プロ・レ・ナータ）は、看護助手として働く皆様のキャリアと日々の業務をサポートする専門情報サイトです。
                    「Pro Re Nata」はラテン語で「必要に応じて」という意味の医療用語で、患者様に必要なケアを適切なタイミングで提供するという
                    医療現場の基本理念を表しています。
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold leading-8 tracking-tight text-gray-900 mb-4">
                    私たちの使命
                  </h2>
                  <div className="space-y-4 text-gray-700">
                    <p>
                      看護助手は医療チームの重要な一員として、患者様の療養生活を直接支える貴重な存在です。
                      しかし、その重要性に比べて情報やサポートが不足しているのが現状です。
                    </p>
                    <p>
                      ProReNataは、現場経験豊富な専門家の知見を基に、看護助手の皆様が自信を持って業務に取り組み、
                      キャリアを発展させるために必要な情報を提供します。
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold leading-8 tracking-tight text-gray-900 mb-4">
                    提供するコンテンツ
                  </h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">基礎知識・スキル</h3>
                      <p className="text-sm text-gray-600">
                        看護助手としての基本的な知識から応用技術まで、現場で役立つ実践的な情報をお届けします。
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">キャリア支援</h3>
                      <p className="text-sm text-gray-600">
                        転職活動のコツ、資格取得情報、看護師を目指す方への道筋など、キャリア発展をサポートします。
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">現場ノウハウ</h3>
                      <p className="text-sm text-gray-600">
                        患者対応、業務効率化、チームワークなど、経験者だからこそ知る現場の知恵を共有します。
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">業界情報</h3>
                      <p className="text-sm text-gray-600">
                        法改正、制度変更、最新技術など、看護助手を取り巻く環境の変化について解説します。
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold leading-8 tracking-tight text-gray-900 mb-4">
                    私たちの約束
                  </h2>
                  <div className="bg-cyan-50 rounded-lg p-6">
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-start">
                        <span className="text-cyan-600 mr-2">✓</span>
                        <span>現場経験に基づいた実践的で正確な情報の提供</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-cyan-600 mr-2">✓</span>
                        <span>看護助手の皆様の立場に立った親身なサポート</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-cyan-600 mr-2">✓</span>
                        <span>継続的な学習と成長を支援する豊富なリソース</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-cyan-600 mr-2">✓</span>
                        <span>最新の業界動向を反映したタイムリーな情報更新</span>
                      </li>
                    </ul>
                  </div>
                </section>


                <section className="border-t border-gray-200 pt-8">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      一緒に看護助手の未来を築いていきましょう
                    </h3>
                    <p className="text-gray-600 mb-6">
                      ご質問、ご要望、記事のリクエストなど、お気軽にお声をお聞かせください。
                    </p>
                    <Link
                      href="/blog"
                      className="rounded-md bg-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500"
                    >
                      最新記事を読む
                    </Link>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}