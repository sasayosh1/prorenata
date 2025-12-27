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
                <span className="text-gray-900 font-medium">About</span>
              </nav>

              <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
                About ProReNata
              </h1>
              <p className="text-lg leading-7 text-gray-500">
                看護助手の未来を、嘘のない情報で支える専門メディア
              </p>
            </div>

            <div className="prose max-w-none pt-8 pb-8 text-gray-900">
              <div className="space-y-12">

                {/* 運営理念セクション */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    「信頼できる情報」を、現場で働くあなたへ
                  </h2>
                  <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                    <p>
                      ProReNata（プロレナータ）は、現役の看護助手や、これから看護助手を目指す方のための情報ウェブマガジンです。
                      サイト名の由来は、ラテン語の医療用語「<span className="font-semibold text-cyan-700">必要なときに（Pro Re Nata）</span>」。
                    </p>
                    <p>
                      あなたが仕事やキャリアで迷ったとき、必要な情報をすぐに、そして正確に取り出せる「薬箱」のような存在でありたい──そんな願いを込めました。
                    </p>
                  </div>
                </section>

                {/* 白崎セラの役割再定義 */}
                <section className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8 shadow-sm border border-cyan-100">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="flex-shrink-0">
                      <div className="relative w-40 h-40 rounded-full overflow-hidden ring-4 ring-white shadow-lg bg-white">
                        <Image
                          src="/images/sera_profile.png"
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
                      <h2 className="text-2xl font-bold text-gray-900 mb-2 mt-0">
                        白崎セラ
                      </h2>
                      <p className="text-cyan-700 font-medium mb-4">
                        ProReNata 公式ナビゲーター
                      </p>
                      <p className="text-gray-700 leading-relaxed mb-4">
                        当サイトの案内役。複雑な医療制度や業界の動向を、分かりやすく噛み砕いてお伝えします。
                        ProReNata編集部が収集した膨大なデータと知見をベースに、あなたのキャリアに伴走する「頼れるガイド」として活動しています。
                      </p>
                      <div className="p-4 bg-white/80 rounded-lg text-sm text-gray-600 italic">
                        「データや法律は少し難しく感じるかもしれませんが、私が間に入って分かりやすくお繋ぎします。一緒にこれからの道を探していきましょう。」
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3つの約束（編集方針） */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    読者への3つの約束（編集方針）
                  </h2>
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                      <div className="text-3xl mb-3">⚖️</div>
                      <h3 className="font-bold text-lg mb-3">嘘のない客観性</h3>
                      <p className="text-gray-600 text-sm">
                        個人の主観や感情だけでなく、法令・厚労省データ・複数の市場調査に基づいた客観的な情報発信を徹底します。
                      </p>
                    </div>
                    <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                      <div className="text-3xl mb-3">🛡️</div>
                      <h3 className="font-bold text-lg mb-3">運営の透明性</h3>
                      <p className="text-gray-600 text-sm">
                        運営主体は「ProReNata編集部」です。特定の個人名ではなく、組織として責任を持って情報を精査・更新します。
                      </p>
                    </div>
                    <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                      <div className="text-3xl mb-3">🤝</div>
                      <h3 className="font-bold text-lg mb-3">意思決定の尊重</h3>
                      <p className="text-gray-600 text-sm">
                        「絶対にこうすべき」という押し付けはしません。あなたが自分の意志で最適な選択ができるよう、判断材料を提示します。
                      </p>
                    </div>
                  </div>
                </section>

                {/* 運営体制と収益構造 */}
                <section className="border-t border-gray-200 pt-10">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    運営体制と広告について
                  </h2>
                  <div className="text-gray-700 text-sm space-y-4 leading-relaxed">
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
