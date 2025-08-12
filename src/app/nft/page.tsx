import { mcp__cnp_mcp__get_info, mcp__cnp_mcp__search_by_traits, mcp__cnp_mcp__get_traits_types } from '@/lib/cnp-api'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface CNPInfo {
  chain: string
  contract_address: string
  standard: string
  description: string
  homepage: string
  twitter: string
  total_supply: number
  total_edition: number
}

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

export default async function NFTPage() {
  let cnpInfo: CNPInfo | null = null
  let lunaCharacters: NFTData[] | null = null
  let traitTypes: string[] | null = null
  
  try {
    const [infoResponse, lunaResponse, traitsResponse] = await Promise.all([
      mcp__cnp_mcp__get_info(),
      mcp__cnp_mcp__search_by_traits({
        conditions: [{ trait_type: "CHARACTER", value: "Luna" }],
        limit: 8,
        include_attributes: true
      }),
      mcp__cnp_mcp__get_traits_types()
    ])
    
    cnpInfo = infoResponse.data
    lunaCharacters = lunaResponse.data
    traitTypes = traitsResponse.data
  } catch (error) {
    console.error('CNP API Error:', error)
  }

  return (
    <div className="medical-gradient-subtle min-h-screen">
      {/* ヘッダー */}
      <header className="medical-gradient text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            ProReNataホームに戻る
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold">CNP NFTコレクション</h1>
              <p className="text-xl text-blue-100">私の趣味の一つ - CryptoNinja Partners</p>
            </div>
          </div>
          
          <p className="text-blue-100 max-w-3xl">
            個人的にコレクションしているNFTアートについて紹介しています。可愛いキャラクターたちを眺めているだけでも癒されます
          </p>
        </div>
      </header>

      <main className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          
          {/* CNPコレクション概要 */}
          {cnpInfo && (
            <section className="medical-card p-8 mb-12">
              <div className="flex items-center gap-3 mb-6">
                <span className="medical-badge medical-badge-primary">NFTコレクション</span>
                <span className="medical-badge medical-badge-secondary">Ethereum</span>
                <span className="medical-badge medical-badge-light">ERC721</span>
              </div>
              
              <h2 className="text-3xl font-bold text-slate-800 mb-4">CryptoNinja Partners</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-3">コレクション情報</h3>
                  <div className="space-y-2 text-slate-600">
                    <p><strong>総供給量:</strong> {cnpInfo.total_supply?.toLocaleString()} NFT</p>
                    <p><strong>総エディション:</strong> {cnpInfo.total_edition?.toLocaleString()}</p>
                    <p><strong>チェーン:</strong> {cnpInfo.chain}</p>
                    <p><strong>規格:</strong> {cnpInfo.standard}</p>
                  </div>
                  
                  <div className="flex gap-4 mt-4">
                    <a href={cnpInfo.homepage} target="_blank" rel="noopener noreferrer" 
                       className="btn btn-outline text-sm">
                      公式サイト
                    </a>
                    <a href={cnpInfo.twitter} target="_blank" rel="noopener noreferrer" 
                       className="btn btn-outline text-sm">
                      Twitter
                    </a>
                  </div>
                </div>
                
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">個人的な感想</h4>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    看護助手として働いていた時、忙しい毎日の中で可愛いキャラクターたちに
                    癒されることがありました。NFTアートも同じように、見ているだけで
                    ほっこりした気持ちになれる、私にとって大切な趣味の一つです。
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Lunaキャラクター特集 */}
          {lunaCharacters && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-slate-800">Lunaキャラクター特集</h2>
                <span className="medical-badge medical-badge-light">
                  {lunaCharacters.length}体表示中 / 約2,045体
                </span>
              </div>
              
              <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
                {lunaCharacters.map((nft: NFTData) => (
                  <Link key={nft.edition} href="/nft/luna" className="medical-card group">
                    <div className="aspect-square bg-slate-100 rounded-t-lg overflow-hidden relative">
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
                        <span className="text-xs text-slate-500">Luna</span>
                      </div>
                      
                      <h3 className="font-semibold text-slate-800 mb-2 text-sm group-hover:text-blue-600 transition-colors">
                        {nft.name}
                      </h3>
                      
                      {nft.attributes && (
                        <div className="space-y-1">
                          {nft.attributes.filter((attr: NFTAttribute) => 
                            ['COSPLAY', 'CLAN'].includes(attr.trait_type)
                          ).map((attr: NFTAttribute, index: number) => (
                            <div key={index} className="flex justify-between text-xs">
                              <span className="text-slate-500">{attr.trait_type}:</span>
                              <span className="text-slate-700 font-medium">{attr.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              
              <div className="text-center mt-8">
                <Link href="/nft/luna" className="btn btn-outline">
                  Lunaコレクション詳細を見る
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </section>
          )}

          {/* 特性情報 */}
          {traitTypes && (
            <section className="medical-card p-8 mb-12">
              <h2 className="text-3xl font-bold text-slate-800 mb-6">CNP特性カテゴリ</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {traitTypes.map((trait: string, index: number) => (
                  <div key={index} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <span className="text-slate-700 font-medium text-sm">{trait}</span>
                  </div>
                ))}
              </div>
              <p className="text-slate-600 text-sm mt-4">
                CNPには{traitTypes.length}種類の特性カテゴリがあり、各NFTは複数の特性を組み合わせて
                ユニークな個性を表現しています。
              </p>
            </section>
          )}

          {/* NFTの魅力 */}
          <section className="medical-card p-8 mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">NFTアートの魅力（個人的感想）</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">癒し効果</h3>
                <p className="text-slate-600 text-sm">
                  可愛いキャラクターたちを見ているだけで
                  疲れた心が癒されます
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">コレクションの楽しさ</h3>
                <p className="text-slate-600 text-sm">
                  お気に入りのキャラクターを
                  集める楽しみがあります
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">コミュニティ</h3>
                <p className="text-slate-600 text-sm">
                  同じ趣味を持つ人たちとの
                  交流も楽しいです
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="medical-gradient text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">趣味の時間も大切に</h2>
            <p className="text-blue-100 mb-6">
              看護助手の仕事は大変でしたが、こうした趣味があったおかげで
              心のバランスを保つことができました。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/" className="btn btn-secondary">
                ブログ記事を読む
              </Link>
              <a href={cnpInfo?.homepage} target="_blank" rel="noopener noreferrer" 
                 className="btn btn-outline bg-white text-blue-600 border-white hover:bg-blue-50">
                CNP公式サイト
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}