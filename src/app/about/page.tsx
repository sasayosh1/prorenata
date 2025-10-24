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
              {/* パンくずナビゲーション */}
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                <Link href="/" className="hover:text-cyan-600 transition-colors duration-200">
                  ホーム
                </Link>
                <span className="text-gray-300">/</span>
                <span className="text-gray-900 font-medium">About</span>
              </nav>

              <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
                About ProReNata
              </h1>
              <p className="text-lg leading-7 text-gray-500">
                看護助手として働く「白崎セラ」が運営する情報サイトについて
              </p>
            </div>
            
            <div className="prose max-w-none pt-8 pb-8 text-gray-900">
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold leading-8 tracking-tight text-gray-900 mb-4">
                    初めまして、白崎セラです
                  </h2>
                  <p className="text-lg leading-7 text-gray-700 mb-6">
                    看護助手として病棟で働きながら、同じ立場の皆さんに寄り添える場所をつくりたい──そんな思いで ProReNata を運営しています。
                    「必要なときに、必要な言葉を届けたい」という気持ちから、ラテン語の医療用語 <em>Pro Re Nata</em> をサイト名に選びました。
                    わたしが現場で感じたこと、調べて確かめたことを、落ち着いて伝えていきます。
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold leading-8 tracking-tight text-gray-900 mb-4">
                    わたしが大切にしていること
                  </h2>
                  <div className="space-y-4 text-gray-700">
                    <p>
                      看護助手は、患者さんにいちばん近いところで支える大切な存在です。それなのに、実務やキャリアについての情報が少なくて、
                      不安を抱えたまま働いている方が多いと感じています。
                    </p>
                    <p>
                      ProReNataでは、わたし自身の体験に加え、信頼できるデータや専門家の意見を組み合わせてお届けします。
                      優しい言葉だけに寄りかからず、必要なときには現実的な視点もしっかり伝える──それがわたしの「寄り添う」かたちです。
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold leading-8 tracking-tight text-gray-900 mb-4">
                    お届けする主なコンテンツ
                  </h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">基礎知識・スキル</h3>
                      <p className="text-sm text-gray-600">
                        先輩方から教わったことや、現場で役立った工夫を整理し、初めての方にも分かりやすくまとめています。
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">キャリア支援</h3>
                      <p className="text-sm text-gray-600">
                        転職・資格・学び直しの選択肢を、費用やスケジュール感も含めて現実的に整理します。
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">現場ノウハウ</h3>
                      <p className="text-sm text-gray-600">
                        患者さんへの声かけ、チーム連携、夜勤の乗り越え方など、毎日の業務をラクにする視点を共有します。
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">業界情報</h3>
                      <p className="text-sm text-gray-600">
                        法改正や制度の変更、デジタル医療の動きなど、知っておきたいトピックを噛み砕いて解説します。
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold leading-8 tracking-tight text-gray-900 mb-4">
                    読者のみなさんへの約束
                  </h2>
                  <div className="bg-cyan-50 rounded-lg p-6">
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-start">
                        <span className="text-cyan-600 mr-2">✓</span>
                        <span>現場経験と客観的な情報を両立させた、誠実な記事をお届けします。</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-cyan-600 mr-2">✓</span>
                        <span>看護助手としての視点を忘れず、読者一人ひとりの不安に寄り添います。</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-cyan-600 mr-2">✓</span>
                        <span>学び続けるための資料やチェックリストなど、現場で使えるリソースを増やします。</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-cyan-600 mr-2">✓</span>
                        <span>最新の制度やトレンドを追いかけ、必要なタイミングで更新します。</span>
                      </li>
                    </ul>
                  </div>
                </section>


                <section className="border-t border-gray-200 pt-8">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      無理をしすぎず、一緒に前へ進んでいきましょう
                    </h3>
                    <p className="text-gray-600 mb-6">
                      今日の業務、お疲れさまでした。ご質問や記事のリクエストがあれば、いつでもお寄せください。小さなごほうびを忘れずに、また明日も頑張りましょう。
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                      <Link
                        href="/blog"
                        className="rounded-md bg-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500"
                      >
                        最新記事を読む
                      </Link>
                      <Link
                        href="/"
                        className="text-cyan-600 hover:text-cyan-700 font-medium"
                      >
                        ← ホームに戻る
                      </Link>
                    </div>
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
