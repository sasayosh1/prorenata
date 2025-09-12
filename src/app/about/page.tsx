import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
      <div className="flex h-screen flex-col justify-between font-sans">
        {/* Header */}
        <header className="flex items-center justify-between py-10">
          <div>
            <Link href="/" aria-label="ProReNata">
              <div className="flex items-center justify-between">
                <div className="mr-3">
                  <div className="text-2xl font-semibold text-gray-900">
                    ProReNata
                  </div>
                </div>
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-4 leading-5 sm:space-x-6">
            <Link
              href="/blog"
              className="hidden font-medium text-gray-900 hover:text-cyan-600 sm:block"
            >
              ブログ
            </Link>
            <Link
              href="/tags"
              className="hidden font-medium text-gray-900 hover:text-cyan-600 sm:block"
            >
              タグ
            </Link>
            <Link
              href="/about"
              className="hidden font-medium text-gray-900 hover:text-cyan-600 sm:block"
            >
              About
            </Link>
          </div>
        </header>

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

                <section>
                  <h2 className="text-2xl font-bold leading-8 tracking-tight text-gray-900 mb-4">
                    今後の展開
                  </h2>
                  <div className="text-gray-700">
                    <p className="mb-4">
                      現在はブログを中心とした情報発信を行っていますが、今後は以下のサービス展開を予定しています：
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>転職サポートサービス</li>
                      <li>スキルアップのための学習リソース</li>
                      <li>看護助手同士のコミュニティ機能</li>
                      <li>専門家による相談サービス</li>
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

        {/* Footer */}
        <footer>
          <div className="mt-16 flex flex-col items-center">
            <div className="mb-3 flex space-x-4">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  className="fill-current text-gray-700 hover:text-cyan-600 h-5 w-5"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                </svg>
              </div>
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="fill-current text-gray-700 hover:text-cyan-600 h-5 w-5"
                >
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                </svg>
              </div>
            </div>
            <div className="mb-2 flex space-x-2 text-sm text-gray-500">
              <div>{`© ${new Date().getFullYear()}`}</div>
              <div>{` • `}</div>
              <Link href="/">ProReNata</Link>
            </div>
            <div className="mb-8 text-sm text-gray-500">
              看護助手の皆様を応援するブログ
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}