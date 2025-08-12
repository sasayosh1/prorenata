import { mcp__cnp_mcp__search_by_traits } from '@/lib/cnp-api'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface NFTAttribute {
  trait_type: string
  value: string | number
}

interface NFTData {
  edition: number
  name: string
  description: string
  image: string
  attributes: NFTAttribute[]
}

interface CharacterPageProps {
  params: Promise<{
    character: string
  }>
}

export async function generateStaticParams() {
  const validCharacters = [
    'leelee', 'luna', 'makami', 'mitama', 
    'narukami', 'orochi', 'setsuna', 'towa', 'yama'
  ]
  
  return validCharacters.map((character) => ({
    character: character
  }))
}

export default async function CharacterPage({ params }: CharacterPageProps) {
  const resolvedParams = await params
  const characterName = resolvedParams.character.charAt(0).toUpperCase() + resolvedParams.character.slice(1)
  
  // 有効なキャラクター名をチェック
  const validCharacters = ['Leelee', 'Luna', 'Makami', 'Mitama', 'Narukami', 'Orochi', 'Setsuna', 'Towa', 'Yama']
  if (!validCharacters.includes(characterName)) {
    notFound()
  }

  let characterNFTs: NFTData[] | null = null
  
  try {
    const response = await mcp__cnp_mcp__search_by_traits({
      conditions: [{ trait_type: "CHARACTER", value: characterName }],
      limit: 12,
      include_attributes: true
    })
    characterNFTs = response.data
  } catch (error) {
    console.error('CNP API Error:', error)
  }

  // キャラクター説明マッピング
  const characterDescriptions = {
    Luna: {
      description: "ウサギの「ルナ」は、CryptoNinjaに登場する於兎 Otoのパートナー。任務を遂行するため、さまざまな姿に変身しているようです。",
      medicalConnection: "ルナの優しい表情と癒しの色合いは、小児医療現場でのアートセラピーに活用できる可能性があります。",
      traits: ["変身能力", "パートナーシップ", "ミッション遂行", "癒し効果"]
    },
    Leelee: {
      description: "リーリーは忍者猫のキャラクター。機敏で賢く、様々な忍術を駆使して活動します。",
      medicalConnection: "リーリーの機敏さは医療従事者の迅速な対応力を象徴し、チームワークの重要性を表現しています。",
      traits: ["機敏性", "知恵", "忍術", "チームワーク"]
    },
    Makami: {
      description: "マカミは狼のキャラクター。強靭な精神力と仲間を守る意志を持っています。",
      medicalConnection: "マカミの保護本能は、医療従事者の患者さんを守る使命感と共通しています。",
      traits: ["強靭性", "保護本能", "リーダーシップ", "忠誠心"]
    },
    Mitama: {
      description: "ミタマは神秘的な力を持つキャラクター。精神的な癒しをもたらします。",
      medicalConnection: "ミタマの神秘的な力は、心理療法やスピリチュアルケアの分野で活用が期待されます。",
      traits: ["神秘性", "癒し", "精神力", "スピリチュアル"]
    },
    Narukami: {
      description: "ナルカミは雷の力を持つ強力なキャラクター。エネルギッシュで活動的です。",
      medicalConnection: "ナルカミのエネルギーは、リハビリテーション分野での患者さんの活力回復を支援します。",
      traits: ["雷の力", "エネルギッシュ", "活動力", "パワフル"]
    },
    Orochi: {
      description: "オロチは大蛇のキャラクター。深い知恵と変革の力を持っています。",
      medicalConnection: "オロチの変革力は、医療技術革新や治療法の進歩を象徴しています。",
      traits: ["深い知恵", "変革力", "神秘性", "進歩"]
    },
    Setsuna: {
      description: "セツナは時を操るキャラクター。瞬間の大切さを教えてくれます。",
      medicalConnection: "セツナの時間意識は、救急医療での迅速な判断力の重要性を表現しています。",
      traits: ["時間操作", "瞬間の価値", "迅速性", "判断力"]
    },
    Towa: {
      description: "トワは永遠を司るキャラクター。持続的な愛と希望を象徴します。",
      medicalConnection: "トワの永続性は、継続的な医療ケアと患者さんとの長期的な関係性を表現しています。",
      traits: ["永遠性", "持続性", "希望", "愛情"]
    },
    Yama: {
      description: "ヤマは山の精霊のキャラクター。安定感と包容力を持っています。",
      medicalConnection: "ヤマの安定感は、医療従事者の冷静さと患者さんへの包容力を象徴しています。",
      traits: ["安定感", "包容力", "冷静さ", "信頼性"]
    }
  }

  const characterInfo = characterDescriptions[characterName as keyof typeof characterDescriptions]

  return (
    <div className="medical-gradient-subtle min-h-screen">
      {/* ヘッダー */}
      <header className="medical-gradient text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/nft" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            CNP NFTコレクションに戻る
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold">{characterName.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold">{characterName} コレクション</h1>
              <p className="text-xl text-blue-100">医療アートセラピー視点からの分析</p>
            </div>
          </div>
        </div>
      </header>

      <main className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          
          {/* キャラクター詳細 */}
          {characterInfo && (
            <section className="medical-card p-8 mb-12">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="medical-badge medical-badge-primary">{characterName}</span>
                    <span className="medical-badge medical-badge-secondary">キャラクター分析</span>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-slate-800 mb-4">キャラクター概要</h2>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    {characterInfo.description}
                  </p>
                  
                  <h3 className="text-xl font-semibold text-slate-700 mb-3">主要特性</h3>
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {characterInfo.traits.map((trait, index) => (
                      <div key={index} className="bg-slate-50 rounded-lg p-2 text-center">
                        <span className="text-slate-700 text-sm font-medium">{trait}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                  <h3 className="text-xl font-semibold text-blue-800 mb-4">医療現場での活用可能性</h3>
                  <p className="text-blue-700 leading-relaxed mb-4">
                    {characterInfo.medicalConnection}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      アートセラピー適応
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      患者コミュニケーション支援
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      医療従事者メンタルサポート
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* NFTギャラリー */}
          {characterNFTs && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-slate-800">{characterName} NFTギャラリー</h2>
                <span className="medical-badge medical-badge-light">
                  {characterNFTs.length}体表示中
                </span>
              </div>
              
              <div className="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-6">
                {characterNFTs.map((nft: NFTData) => (
                  <div key={nft.edition} className="medical-card group overflow-hidden">
                    <div className="aspect-square bg-slate-100 overflow-hidden relative">
                      <Image 
                        src={nft.image} 
                        alt={nft.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="medical-badge medical-badge-primary text-xs">
                          #{nft.edition}
                        </span>
                        <span className="text-xs text-slate-500">{characterName}</span>
                      </div>
                      
                      <h3 className="font-semibold text-slate-800 mb-2 text-sm">
                        {nft.name}
                      </h3>
                      
                      {nft.attributes && (
                        <div className="space-y-1">
                          {nft.attributes
                            .filter((attr: NFTAttribute) => ['COSPLAY', 'CLAN', 'NINJUTSU'].includes(attr.trait_type))
                            .slice(0, 3)
                            .map((attr: NFTAttribute, index: number) => (
                            <div key={index} className="flex justify-between text-xs">
                              <span className="text-slate-500">{attr.trait_type}:</span>
                              <span className="text-slate-700 font-medium">{attr.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 医療応用研究 */}
          <section className="medical-card p-8 mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">{characterName}を活用した医療応用研究</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">小児医療</h3>
                <p className="text-slate-600 text-sm">
                  {characterName}キャラクターを使った子供向け
                  医療説明ツールの開発と効果測定
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">認知療法</h3>
                <p className="text-slate-600 text-sm">
                  デジタルアートを活用した認知機能改善
                  プログラムでの{characterName}活用事例
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">リハビリ支援</h3>
                <p className="text-slate-600 text-sm">
                  {characterName}キャラクターを使った
                  モチベーション向上とリハビリ継続支援
                </p>
              </div>
            </div>
          </section>

          {/* 戻るリンク */}
          <div className="text-center">
            <Link href="/nft" className="btn btn-primary">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              CNP NFTコレクションに戻る
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}