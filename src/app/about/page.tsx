import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function AboutPage() {
  return (
    <>
      <Header />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0">
        <main>
          <div className="divide-y divide-gray-200">
            <div className="space-y-2 pb-8 pt-6 md:space-y-5">
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                <Link href="/" className="hover:text-cyan-600 transition-colors duration-200">
                  ホーム
                </Link>
                <span className="text-gray-300">/</span>
                <span className="text-gray-900 dark:text-white font-medium">About</span>
              </nav>

              <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-white sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
                About ProReNata
              </h1>
              <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
                看護助手の未来を、嘘のない情報で支える専門メディア
              </p>
            </div>

            <div className="prose max-w-none pt-8 pb-8 text-gray-900 dark:text-gray-100">
              <div className="space-y-12">

                {/* 運営理念セクション */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    「信頼できる情報」を、現場で働くあなたへ
                  </h2>
                  <div className="space-y-4 text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                    <p>
                      ProReNata（プロレナータ）は、現役の看護助手や、これから看護助手を目指す方のための情報ウェブマガジンです。
                      サイト名の由来は、ラテン語の医療用語「<span className="font-semibold text-cyan-700 dark:text-cyan-400">必要なときに（ProReNata）</span>」。
                    </p>
                    <p>
                      あなたが仕事やキャリアで迷ったとき、必要な情報をすぐに、そして正確に取り出せる「薬箱」のような存在でありたい──そんな願いを込めました。
                    </p>
                  </div>
                </section>

                {/* 白崎セラの役割再定義 */}
                <section className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-2xl p-8 shadow-sm border border-cyan-100 dark:border-cyan-800">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="flex-shrink-0">
                      <div className="relative w-40 h-40 rounded-full overflow-hidden ring-4 ring-white dark:ring-gray-800 shadow-lg bg-white dark:bg-gray-800">
                        <Image
                          src="/sera_icon_new.png"
                          alt="白崎セラ"
                          fill
                          sizes="160px"
                          className="object-cover"
                          priority
                        />
                      </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                      <div className="inline-block px-3 py-1 bg-cyan-600 text-white text-xs font-bold rounded-full mb-3">
                        Official Navigator
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 mt-0">
                        白崎セラ
                      </h2>
                      <p className="text-cyan-700 dark:text-cyan-400 font-medium mb-4">
                        ProReNata 公式ナビゲーター
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        当サイトの案内役。複雑な医療制度や業界の動向を、分かりやすく噛み砕いてお伝えします。
                        ProReNata編集部が収集した膨大なデータと知見をベースに、あなたのキャリアに伴走する「頼れるガイド」として活動しています。
                      </p>
                      <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
                        <div className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg text-sm text-gray-600 dark:text-gray-400 italic flex-1">
                          「データや法律は少し難しく感じるかもしれませんが、私が間に入って分かりやすくお繋ぎします。一緒にこれからの道を探していきましょう。」
                        </div>
                        <a
                          href="https://note.com/prorenata"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-[#2cb696] hover:bg-[#239178] text-white rounded-full text-sm font-bold transition-colors shadow-sm self-center"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.8 2H6.2C3.9 2 2 3.9 2 6.2v11.6C2 20.1 3.9 22 6.2 22h11.6c2.3 0 4.2-1.9 4.2-4.2V6.2C22 3.9 20.1 2 17.8 2zM15 17.5h-1.5v-7h-1.5v7H10.5v-7c0-0.8 0.7-1.5 1.5-1.5h1.5c0.8 0 1.5 0.7 1.5 1.5v7z"></path>
                          </svg>
                          noteでセラの日常に触れる
                        </a>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3つの約束（編集方針） */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    読者への3つの約束（編集方針）
                  </h2>
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
                      <div className="text-3xl mb-3">⚖️</div>
                      <h3 className="font-bold text-lg mb-3 dark:text-white">嘘のない客観性</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        個人の主観や感情だけでなく、法令・厚労省データ・複数の市場調査に基づいた客観的な情報発信を徹底します。
                      </p>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
                      <div className="text-3xl mb-3">🛡️</div>
                      <h3 className="font-bold text-lg mb-3 dark:text-white">運営の透明性</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        運営主体は「ProReNata編集部」です。特定の個人名ではなく、組織として責任を持って情報を精査・更新します。
                      </p>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
                      <div className="text-3xl mb-3">🤝</div>
                      <h3 className="font-bold text-lg mb-3 dark:text-white">意思決定の尊重</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        「絶対にこうすべき」という押し付けはしません。あなたが自分の意志で最適な選択ができるよう、判断材料を提示します。
                      </p>
                    </div>
                  </div>
                </section>

                {/* 運営体制と収益構造 */}
                <section className="border-t border-gray-200 dark:border-gray-800 pt-10">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    運営体制と広告について
                  </h2>
                  <div className="text-gray-700 dark:text-gray-300 text-sm space-y-4 leading-relaxed">
                    <p>
                      <strong>【運営主体】</strong><br />
                      ProReNata編集部（ProReNata Editorial Department）<br />
                      お問い合わせ：<a href="/contact" className="text-cyan-600 hover:underline">お問い合わせフォーム</a>よりお願いいたします。
                    </p>
                    <p>
                      <strong>【広告配信について】</strong><br />
                      当サイトは、読者の皆様への情報提供を継続するため、アフィリエイトプログラムや広告配信（Google AdSense 等）を利用しています。<br />
                      紹介するサービスや商品は、編集部が一定の基準（求人数、サポート体制、利用者の評価など）に基づいて選定しており、広告主の意向だけで掲載内容を決定することはありません。
                      不当な不安を煽って申し込みを強制するような表現は、編集方針として固く禁止しています。
                    </p>
                    <p>
                      <strong>【免責事項】</strong><br />
                      医療行為に関する判断、法的な労使トラブルの解決、税務申告等の専門的な判断については、必ず医師・弁護士・税理士等の専門家にご相談ください。
                      当サイトの情報は、一般的な傾向や制度の解説にとどまるものです。
                    </p>
                  </div>
                </section>

                <section className="text-center pt-8">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center px-8 py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    ProReNata トップへ戻る
                  </Link>
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
