import Link from 'next/link'

// SEO metadata
export const metadata = {
  title: 'コミュニティ | ProReNata - 看護助手の仲間と繋がろう',
  description: '看護助手として働く仲間と繋がり、情報交換や相談ができるコミュニティスペース。CNPキャラクターLunaと一緒に学んでいきましょう。',
  keywords: '看護助手,コミュニティ,情報交換,相談,CNP,Luna,仲間',
  openGraph: {
    title: 'コミュニティ | ProReNata',
    description: '看護助手コミュニティ - 仲間と繋がり、成長しよう',
    type: 'website',
  }
}

// 強制的な動的レンダリング
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CommunityPage() {
  
  const communityFeatures = [
    {
      title: '情報交換フォーラム',
      icon: '💬',
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      description: '看護助手同士で職場の悩みや疑問を相談し合えるフォーラム',
      features: ['職場での悩み相談', '転職情報の交換', '資格取得の相談', 'スキルアップ情報']
    },
    {
      title: 'キャリア相談室',
      icon: '🎯',
      color: 'bg-green-50 border-green-200 text-green-800', 
      description: '経験者からのアドバイスを受けられるキャリア相談コーナー',
      features: ['転職相談', '面接対策', '履歴書添削', 'キャリアプランニング']
    },
    {
      title: '学習グループ',
      icon: '📚',
      color: 'bg-purple-50 border-purple-200 text-purple-800',
      description: '資格取得や勉強を一緒に頑張る学習グループ',
      features: ['資格試験対策', '勉強会の開催', '教材の共有', '成果報告']
    },
    {
      title: 'メンタルサポート',
      icon: '💝',
      color: 'bg-pink-50 border-pink-200 text-pink-800',
      description: '仕事のストレスやメンタルヘルスに関するサポート',
      features: ['ストレス解消法', '燃え尽き症候群対策', 'ワークライフバランス', '心の健康管理']
    }
  ]

  const guidelines = [
    {
      title: '参加前に読んでください',
      items: [
        '他の参加者への敬意を持って接しましょう',
        '個人情報や患者さんの情報は絶対に投稿しないでください',
        '建設的で前向きなコミュニケーションを心がけましょう',
        '医療行為に関するアドバイスは避け、必要な場合は専門医への相談を勧めましょう'
      ]
    },
    {
      title: 'コミュニティルール',
      items: [
        '誹謗中傷や差別的な発言は禁止です',
        '商業目的の投稿や宣伝は控えてください',
        'プライバシーを尊重し、個人を特定できる情報の共有は避けましょう',
        '困ったことがあれば遠慮なくモデレーターにご相談ください'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ヘッダーセクション */}
      <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            {/* CNP Lunaマスコット */}
            <div className="flex items-center justify-center mb-6">
              <div className="bg-white/20 rounded-full p-6 relative">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center relative overflow-hidden">
                  {/* Lunaキャラクターを模したシンプルなアイコン */}
                  <div className="relative w-16 h-16">
                    {/* 顔 */}
                    <div className="w-12 h-12 bg-pink-100 rounded-full absolute top-2 left-2 border-2 border-pink-200"></div>
                    {/* 耳 */}
                    <div className="w-3 h-6 bg-pink-100 rounded-full absolute top-0 left-3 border border-pink-200 transform -rotate-12"></div>
                    <div className="w-3 h-6 bg-pink-100 rounded-full absolute top-0 right-3 border border-pink-200 transform rotate-12"></div>
                    {/* 目 */}
                    <div className="w-2 h-2 bg-blue-600 rounded-full absolute top-4 left-4"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full absolute top-4 right-4"></div>
                    {/* 鼻 */}
                    <div className="w-1 h-1 bg-pink-400 rounded-full absolute top-6 left-1/2 transform -translate-x-1/2"></div>
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                  Luna
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              看護助手コミュニティ
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              仲間と繋がり、一緒に成長しよう
            </p>
            <p className="text-lg max-w-3xl mx-auto leading-relaxed text-blue-50">
              看護助手として働く皆さんが情報交換や相談をし合い、
              共に学び成長できるコミュニティスペースです。
              CNPのLunaと一緒に、温かいコミュニティを作っていきましょう。
            </p>
            
            {/* 統計情報 */}
            <div className="flex flex-wrap justify-center gap-8 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">500+</div>
                <div className="text-blue-100">メンバー</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-blue-100">サポート</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">100%</div>
                <div className="text-blue-100">無料</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ナビゲーション */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="text-slate-700 hover:text-blue-600 font-medium">
              ← ProReNataホームに戻る
            </Link>
            <div className="flex items-center space-x-6">
              <Link href="#features" className="text-slate-700 hover:text-blue-600">
                機能
              </Link>
              <Link href="#guidelines" className="text-slate-700 hover:text-blue-600">
                ガイドライン
              </Link>
              <Link href="#join" className="text-slate-700 hover:text-blue-600">
                参加方法
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Lunaからのメッセージ */}
          <section className="mb-20">
            <div className="bg-white rounded-2xl shadow-lg p-8 border-l-4 border-purple-500">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center relative">
                    {/* 簡単なLunaアバター */}
                    <div className="w-12 h-12 bg-pink-100 rounded-full border-2 border-pink-200 relative">
                      <div className="w-1 h-1 bg-blue-600 rounded-full absolute top-3 left-3"></div>
                      <div className="w-1 h-1 bg-blue-600 rounded-full absolute top-3 right-3"></div>
                      <div className="w-2 h-3 bg-pink-100 rounded-full absolute -top-1 left-2 border border-pink-200"></div>
                      <div className="w-2 h-3 bg-pink-100 rounded-full absolute -top-1 right-2 border border-pink-200"></div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white text-xs px-1 rounded-full">
                      Luna
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">
                    Lunaからのメッセージ 🐰
                  </h3>
                  <div className="text-slate-600 leading-relaxed space-y-3">
                    <p>
                      こんにちは！CNPのLunaです。看護助手として働く皆さんを応援するために、
                      このコミュニティに参加させていただきました。
                    </p>
                    <p>
                      医療現場で働くことは時に大変なこともありますが、皆さんの温かい心と
                      専門性は多くの患者さんの支えになっています。
                    </p>
                    <p>
                      ここは同じ志を持つ仲間と出会い、情報を共有し、
                      一緒に成長していける場所です。私も皆さんと一緒に学んでいきたいと思っています！
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* コミュニティ機能セクション */}
          <section id="features" className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-800 mb-4">
                🌟 コミュニティ機能
              </h2>
              <p className="text-lg text-slate-600">
                看護助手の皆さんをサポートする様々な機能をご用意しています
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {communityFeatures.map((feature, index) => (
                <div key={index} className={`${feature.color} rounded-xl p-6 border-2 hover:shadow-lg transition-all duration-300`}>
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{feature.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-3">
                        {feature.title}
                      </h3>
                      <p className="opacity-80 mb-4">
                        {feature.description}
                      </p>
                      <ul className="space-y-2">
                        {feature.features.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-center gap-2 text-sm">
                            <span className="text-green-600">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ガイドラインセクション */}
          <section id="guidelines" className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-800 mb-4">
                📋 コミュニティガイドライン
              </h2>
              <p className="text-lg text-slate-600">
                皆が安心して参加できる環境を作るためのルールです
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {guidelines.map((guideline, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    {index === 0 ? '📖' : '⚖️'}
                    {guideline.title}
                  </h3>
                  <ul className="space-y-3">
                    {guideline.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3">
                        <span className="text-blue-500 mt-1">•</span>
                        <span className="text-slate-600 text-sm leading-relaxed">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* 参加方法セクション */}
          <section id="join" className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">
                🚀 コミュニティに参加しよう
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                看護助手の仲間と繋がり、一緒に成長していきましょう
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/20 rounded-xl p-6">
                  <div className="text-3xl mb-3">1️⃣</div>
                  <h3 className="font-bold mb-2">アカウント作成</h3>
                  <p className="text-sm text-blue-100">
                    簡単な登録でコミュニティメンバーになれます
                  </p>
                </div>
                <div className="bg-white/20 rounded-xl p-6">
                  <div className="text-3xl mb-3">2️⃣</div>
                  <h3 className="font-bold mb-2">プロフィール設定</h3>
                  <p className="text-sm text-blue-100">
                    経験や興味のある分野を設定しましょう
                  </p>
                </div>
                <div className="bg-white/20 rounded-xl p-6">
                  <div className="text-3xl mb-3">3️⃣</div>
                  <h3 className="font-bold mb-2">交流開始</h3>
                  <p className="text-sm text-blue-100">
                    気になるトピックから参加してみましょう
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold hover:bg-blue-50 transition-colors inline-flex items-center gap-2">
                  <span>🎯</span>
                  コミュニティに参加する
                </button>
                <p className="text-xs text-blue-100">
                  ※現在準備中です。近日公開予定！
                </p>
              </div>
            </div>
          </section>

          {/* CNP情報セクション */}
          <section className="mt-20 bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-4">
                🎨 CNP（CryptoNinja Partners）について
              </h2>
              <p className="text-lg text-slate-600">
                Lunaは、人気NFTコレクション「CNP」のキャラクターです
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">CNPとは？</h3>
                <ul className="space-y-3 text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    日本発の人気NFTコレクション
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    22,222体のユニークなキャラクター
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    忍者をテーマとした可愛いパートナーたち
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    活発なコミュニティ活動
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">Lunaについて</h3>
                <ul className="space-y-3 text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-pink-500 mt-1">•</span>
                    うさぎのキャラクター
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-500 mt-1">•</span>
                    様々な姿に変身できる
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-500 mt-1">•</span>
                    癒し系で親しみやすい
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-500 mt-1">•</span>
                    コミュニティの応援団長
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
              <p className="text-blue-800 text-sm">
                <strong>公式リンク:</strong> 
                <a href="https://www.cryptoninja-partners.xyz/" target="_blank" rel="noopener noreferrer" className="ml-2 underline hover:text-blue-600">
                  CNP公式サイト
                </a>
                <span className="mx-2">|</span>
                <a href="https://x.com/cnp_ninjadao" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">
                  CNP公式Twitter
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-slate-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">看護助手コミュニティ</h3>
            <p className="text-slate-300 mb-6">
              CNP Lunaと一緒に、温かいコミュニティを作っていこう
            </p>
            <div className="flex justify-center space-x-8 text-sm">
              <Link href="/" className="hover:text-white transition-colors">
                ProReNataホーム
              </Link>
              <Link href="/nursing-assistant" className="hover:text-white transition-colors">
                看護助手情報
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                プライバシーポリシー
              </Link>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 mt-8 text-center">
            <p className="text-slate-400 text-sm">
              © 2025 ProReNata 看護助手コミュニティ. All rights reserved.
            </p>
            <p className="text-slate-500 text-xs mt-2">
              CNP Luna キャラクターは CryptoNinja Partners コレクションの一部です。
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}