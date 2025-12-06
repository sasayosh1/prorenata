import Link from 'next/link'
import Image from 'next/image'
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
                看護助手として働く「白崎セラ」が運営する、寄りかかれる情報サイトです。
              </p>
            </div>
            
            <div className="prose max-w-none pt-8 pb-8 text-gray-900">
              <div className="space-y-8">
                {/* 白崎セラのプロフィールカード */}
                <section className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8 shadow-md">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                    {/* プロフィール画像 */}
                    <div className="flex-shrink-0">
                      <div className="relative w-48 h-48 rounded-full overflow-hidden ring-4 ring-white shadow-xl">
                        <Image
                          src="/images/sera_profile.png"
                          alt="白崎セラ"
                          fill
                          sizes="192px"
                          className="object-cover"
                          priority
                        />
                      </div>
                    </div>

                    {/* プロフィール情報 */}
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        白崎セラ
                      </h2>
                      <p className="text-cyan-700 font-semibold mb-4">
                        ProReNata 運営者 / 看護助手
                      </p>
                      <div className="space-y-3 text-gray-700">
                        <div className="flex items-center justify-center md:justify-start gap-2">
                          <span className="text-cyan-600">👤</span>
                          <span>20歳</span>
                        </div>
                        <div className="flex items-center justify-center md:justify-start gap-2">
                          <span className="text-cyan-600">🏥</span>
                          <span>病棟で看護助手として勤務</span>
                        </div>
                        <div className="flex items-center justify-center md:justify-start gap-2">
                          <span className="text-cyan-600">✍️</span>
                          <span>看護助手に寄り添う記事を執筆</span>
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-white rounded-lg shadow-sm">
                        <p className="text-sm text-gray-600 italic">
                          「必要なときに、必要な言葉を届けたい。わたしが現場で感じたことや、調べて確かめたことを、落ち着いて伝えていきたいんです。」
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold leading-8 tracking-tight text-gray-900 mb-4">
                    はじめまして、白崎セラです
                  </h2>
                  <div className="space-y-4 text-lg leading-7 text-gray-700">
                    <p>
                      看護助手として病棟で働きながら、同じ立場のみなさんに寄り添える場所をつくりたい──そんな思いで
                      <span className="mx-1 font-semibold text-cyan-600">ProReNata</span> を運営しています。
                    </p>
                    <p>
                      「必要なときに、必要な言葉を届けたい」。その気持ちをそのまま名前にしたくて、ラテン語の医療用語
                      <em> Pro Re Nata</em>（必要なときに）をサイト名に選びました。現場で感じたことも、調べて確かめたことも、落ち着いて伝えられる場所にしたい──それがこのサイトの出発点です。
                    </p>
                    <p>
                      「わたしだけかな」という不安を少しでも軽くできるように、現場のリアルと確かな情報をそっと並べています。今働いている方も、これから挑戦したい方も、安心して立ち寄ってください。
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold leading-8 tracking-tight text-gray-900 mb-4">
                    このブログを作った理由
                  </h2>
                  <div className="space-y-4 text-lg leading-7 text-gray-700">
                    <p>
                      看護助手は患者さんにいちばん近くで寄り添う、とても大切な役割です。でも、仕事やキャリア、お金のことを安心して相談できる場所は多くありません。わたし自身も同じように迷い、調べ方すら分からない時期がありました。
                    </p>
                    <p>
                      だからこそ、このブログを“寄りかかれる場所”にしたいと思いました。必要なときに、必要な分だけ持ち帰れる情報をそっと置いておく。現場の手触りと公的データを組み合わせて、落ち着いて選べるように整えていきます。
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold leading-8 tracking-tight text-gray-900 mb-4">
                    わたしが大切にしていること
                  </h2>
                  <div className="space-y-4 text-lg leading-7 text-gray-700">
                    <p>
                      「分からないまま何となく進む」不安を、わたしも何度も味わいました。だから、ここでは必ず「体験＋根拠」をセットでお届けします。優しい言葉だけに寄りかからず、必要なときには現実的な視点もきちんと伝える──それが、わたしなりの「寄り添う」形です。
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold leading-8 tracking-tight text-gray-900 mb-4">
                    目指している未来
                  </h2>
                  <div className="space-y-4 text-lg leading-7 text-gray-700">
                    <p>
                      このブログを、“看護助手で終わる”という前提のない場所に育てたいと思っています。わたしたちには、続けることも、進むことも、選び直すことも、どの道も選ぶ自由があります。
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>看護助手として働き続ける</li>
                      <li>看護師をめざす</li>
                      <li>別の医療職に進む</li>
                      <li>まったく新しい道を選ぶ</li>
                    </ul>
                    <p>
                      どの選択肢も、あなたが自分の人生に置いていいものです。迷ったときに、ここに戻ってきて「大丈夫、選んでいいんだ」と思える場所にしていきます。
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold leading-8 tracking-tight text-gray-900 mb-4">
                    お届けしていく主なコンテンツ
                  </h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">基礎知識・スキル</h3>
                      <p className="text-sm text-gray-600">
                        初めての方にも分かりやすく、現場で使える知識や工夫を丁寧にまとめます。手順だけでなく、声かけや気持ちの整え方も大切に。
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">キャリア支援</h3>
                      <p className="text-sm text-gray-600">
                        転職・資格・学び直しなどの選択肢を、費用やスケジュールも含めて現実的に整理します。無理のない計画を一緒に考えます。
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">現場ノウハウ</h3>
                      <p className="text-sm text-gray-600">
                        患者さんとの関わり、チーム連携、夜勤の乗り越え方など、現場でラクになるヒントを共有します。小さなごほうびの見つけ方も少しずつ。
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">業界情報</h3>
                      <p className="text-sm text-gray-600">
                        制度や動向など、知っておきたいトピックを噛み砕いて解説し、必要なタイミングで更新します。出典と一次情報をセットで提示します。
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold leading-8 tracking-tight text-gray-900 mb-4">
                    読者さんへの約束
                  </h2>
                  <div className="bg-cyan-50 rounded-lg p-6">
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-start">
                        <span className="text-cyan-600 mr-2">✓</span>
                        <span>現場経験と客観的な情報を両立した、誠実な記事をお届けします。</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-cyan-600 mr-2">✓</span>
                        <span>看護助手としての視点を忘れず、一人ひとりの不安に寄り添います。</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-cyan-600 mr-2">✓</span>
                        <span>現場で使える資料やチェックリストを少しずつ増やしていきます。</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-cyan-600 mr-2">✓</span>
                        <span>制度やトレンドは、必要なタイミングで更新します。一次情報と出典を必ず確認します。</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-cyan-600 mr-2">✓</span>
                        <span>無理をしすぎず、それぞれのペースで前に進める方法を一緒に考えていきます。</span>
                      </li>
                    </ul>
                  </div>
                </section>

                <section className="border-t border-gray-200 pt-8">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      今日の業務、お疲れさまでした
                    </h3>
                    <p className="text-gray-600 mb-6">
                      ご質問や記事へのリクエストがあれば、いつでもお寄せくださいね。小さなごほうびも忘れずに……どうか無理をせず、あなたのペースで進んでください。わたしはここで待っています。
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
