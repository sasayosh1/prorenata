#!/usr/bin/env node
/**
 * 看護助手のシューズ記事を作成
 */
const { createClient } = require('@sanity/client')
const { randomUUID } = require('crypto')
const { createMoshimoLinkBlocks } = require('./moshimo-affiliate-links')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN,
  useCdn: false
})

async function createShoesArticle() {
  // タイトルとスラッグ
  const title = '看護助手におすすめのシューズ7選｜現場で本当に使える靴の選び方'
  const slug = 'nursing-assistant-recommended-shoes'

  // カテゴリを取得（「業務内容」を使用）
  const categories = await client.fetch(`*[_type == 'category' && title == '業務内容'][0]`)

  console.log('📝 記事作成中...')
  console.log(`タイトル: ${title}`)
  console.log(`スラッグ: ${slug}`)
  console.log(`カテゴリ: ${categories?.title || '業務内容'}`)

  // 記事本文を構築
  const body = [
    // 導入段落
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'normal',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '看護助手の仕事では、一日中立ちっぱなしや歩き回ることが多く、靴選びは本当に重要です。足が疲れると集中力が落ちて、患者さんへの対応にも影響が出てしまいます。わたし自身も最初は靴選びに失敗して、夕方には足がパンパンに腫れてしまった経験があります。',
        marks: []
      }]
    },
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'normal',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: 'この記事では、現場で実際に使っている看護助手の視点から、本当におすすめできるシューズを7つ厳選してご紹介します。選び方のポイントも詳しく解説しますので、ぜひ参考にしてください。',
        marks: []
      }]
    },

    // H2: 看護助手の靴に求められる3つの条件
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'h2',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '看護助手の靴に求められる3つの条件',
        marks: []
      }]
    },
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'normal',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '現場で使う靴には、以下の3つの条件が欠かせません。',
        marks: []
      }]
    },

    // H3: 1. クッション性と安定性
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'h3',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '1. クッション性と安定性',
        marks: []
      }]
    },
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'normal',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '一日中立ち仕事をするため、クッション性の高いソールは必須です。特にかかと部分のクッションがしっかりしていると、足への負担が大きく軽減されます。また、床が濡れていることもあるため、滑りにくいソールも重要なポイントです。',
        marks: []
      }]
    },

    // H3: 2. 通気性と衛生面
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'h3',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '2. 通気性と衛生面',
        marks: []
      }]
    },
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'normal',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '病院内は温度管理されていますが、動き回ると足が蒸れやすくなります。メッシュ素材など通気性の良い靴を選ぶことで、長時間履いても快適さを保てます。また、洗濯可能なタイプだと衛生的に保ちやすく安心です。',
        marks: []
      }]
    },

    // H3: 3. 脱ぎ履きのしやすさ
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'h3',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '3. 脱ぎ履きのしやすさ',
        marks: []
      }]
    },
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'normal',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '休憩時間や更衣室での脱ぎ履きが頻繁にあるため、スムーズに脱ぎ履きできる靴が便利です。紐靴よりもマジックテープやスリッポンタイプの方が、時間を節約できて実用的です。',
        marks: []
      }]
    },

    // H2: 現場で実際に使っているおすすめシューズ7選
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'h2',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '現場で実際に使っているおすすめシューズ7選',
        marks: []
      }]
    },
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'normal',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: 'ここからは、実際に現場で人気のあるシューズを7つご紹介します。それぞれの特徴と、どんな人におすすめかも解説します。',
        marks: []
      }]
    },

    // シューズ1: アシックス ナースウォーカー
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'h3',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '1. アシックス ナースウォーカー',
        marks: []
      }]
    },
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'normal',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '看護・介護職向けに開発されたシューズで、クッション性と耐久性に優れています。滑りにくいソールで安全性も高く、長時間立ち仕事でも疲れにくい設計です。サイズ展開も豊富で、足幅が広い方にもおすすめです。',
        marks: []
      }]
    },

    // シューズ2: ミズノ ワーキングシューズ
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'h3',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '2. ミズノ ワーキングシューズ',
        marks: []
      }]
    },
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'normal',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '軽量で通気性が良く、長時間履いても蒸れにくいのが特徴です。ミズノ独自のクッション技術で足への衝撃を吸収し、疲労を軽減してくれます。デザインもシンプルで、どんなユニフォームにも合わせやすいです。',
        marks: []
      }]
    },

    // シューズ3: ナースリーオリジナル スリッポン
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'h3',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '3. ナースリーオリジナル スリッポン',
        marks: []
      }]
    },
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'normal',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '脱ぎ履きが非常に楽なスリッポンタイプで、休憩時間の多い方に人気です。インソールが取り外せて洗濯できるため、衛生面も安心です。価格も手頃で、初めて看護助手シューズを購入する方にもおすすめです。',
        marks: []
      }]
    },

    // シューズ4: ニューバランス WW880
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'h3',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '4. ニューバランス WW880',
        marks: []
      }]
    },
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'normal',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: 'ウォーキングシューズとして設計されており、クッション性と安定性が抜群です。足裏全体をしっかりサポートしてくれるため、腰や膝への負担も軽減されます。少し価格は高めですが、長く使える耐久性があります。',
        marks: []
      }]
    },

    // シューズ5: ムーンスター フレッシュナース
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'h3',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '5. ムーンスター フレッシュナース',
        marks: []
      }]
    },
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'normal',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '抗菌・防臭機能がついており、衛生面を特に重視する方におすすめです。マジックテープで足にフィットさせやすく、脱ぎ履きもスムーズです。ソールの耐久性も高く、コストパフォーマンスに優れています。',
        marks: []
      }]
    },

    // シューズ6: アキレス クッキングメイト
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'h3',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '6. アキレス クッキングメイト',
        marks: []
      }]
    },
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'normal',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '厨房用として開発されたシューズですが、病院でも人気があります。滑りにくさが特に優れており、床が濡れている環境でも安心です。軽量で疲れにくく、価格も手頃なのが魅力です。',
        marks: []
      }]
    },

    // シューズ7: クロックス ビストロクロッグ
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'h3',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '7. クロックス ビストロクロッグ',
        marks: []
      }]
    },
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'normal',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '軽量で履き心地が良く、長時間の立ち仕事でも疲れにくいのが特徴です。水洗いができて乾きも早いため、清潔に保ちやすいです。かかとストラップ付きで脱げにくく、動きやすさも確保されています。',
        marks: []
      }]
    },

    // H2: 足が疲れない靴の選び方
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'h2',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '足が疲れない靴の選び方',
        marks: []
      }]
    },
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'normal',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: 'シューズを選ぶ際は、以下のポイントを意識すると失敗しにくくなります。',
        marks: []
      }]
    },

    // H3: サイズは大きめを選ぶ
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'h3',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: 'サイズは大きめを選ぶ',
        marks: []
      }]
    },
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'normal',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '長時間立ち仕事をすると、足がむくんで普段より大きくなります。そのため、靴はジャストサイズよりも0.5〜1cm大きめを選ぶのがおすすめです。つま先に少し余裕があると、足指が圧迫されずに快適です。',
        marks: []
      }]
    },

    // H3: 試し履きは夕方に
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'h3',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '試し履きは夕方に',
        marks: []
      }]
    },
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'normal',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '足は朝よりも夕方の方がむくんで大きくなっています。靴を試し履きするなら、夕方の足のサイズに合わせて選ぶと、実際の勤務時にも快適に履けます。オンラインで購入する場合は、返品・交換が可能なショップを選ぶと安心です。',
        marks: []
      }]
    },

    // H3: インソールで調整する
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'h3',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: 'インソールで調整する',
        marks: []
      }]
    },
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'normal',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '靴のクッション性が足りないと感じたら、クッション性の高いインソールを追加するのもおすすめです。衝撃吸収インソールや土踏まずをサポートするインソールを使うことで、足への負担をさらに軽減できます。',
        marks: []
      }]
    },

    // H2: まとめ
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'h2',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: 'まとめ',
        marks: []
      }]
    },
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'normal',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '看護助手の仕事では、靴選びが仕事のパフォーマンスに直結します。クッション性・通気性・脱ぎ履きのしやすさの3つを満たす靴を選ぶことで、一日中快適に働けます。',
        marks: []
      }]
    },
    {
      _type: 'block',
      _key: randomUUID(),
      style: 'normal',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: randomUUID(),
        text: '今回ご紹介した7つのシューズは、どれも現場で実際に使われている信頼できるものばかりです。ご自身の足の形や勤務環境に合わせて、最適な一足を見つけてください。足が楽になると、仕事への集中力も上がり、患者さんへのケアもより丁寧にできるようになります。',
        marks: []
      }]
    }
  ]

  // Amazon/楽天/ナースリーリンクを挿入
  console.log('\n📎 アフィリエイトリンクを追加中...')
  const amazonBlocks = createMoshimoLinkBlocks('amazon', '')
  const rakutenBlocks = createMoshimoLinkBlocks('rakuten', '')
  const nurseryBlocks = createMoshimoLinkBlocks('nursery', '')

  if (amazonBlocks) body.push(...amazonBlocks)
  if (rakutenBlocks) body.push(...rakutenBlocks)
  if (nurseryBlocks) body.push(...nurseryBlocks)

  // 免責事項を追加
  body.push({
    _type: 'block',
    _key: randomUUID(),
    style: 'normal',
    markDefs: [],
    children: [{
      _type: 'span',
      _key: randomUUID(),
      text: '免責事項: この記事は、看護助手としての現場経験に基づく一般的な情報提供を目的としています。職場や地域、個人の状況によって異なる場合がありますので、詳細は勤務先や専門家にご確認ください。',
      marks: []
    }]
  })

  // Excerptを生成（100〜150文字）
  const excerpt = '看護助手の仕事では一日中立ちっぱなしや歩き回ることが多く、靴選びが本当に重要です。クッション性・通気性・脱ぎ履きのしやすさを満たすおすすめシューズ7選と、足が疲れない選び方のポイントを現場目線で詳しくお伝えします。'

  // Meta Descriptionを生成（120〜160文字）
  const metaDescription = '看護助手におすすめのシューズ7選を現場経験から厳選紹介。一日中立ち仕事でも疲れにくい靴の選び方、クッション性・通気性・脱ぎ履きのしやすさなど重視すべきポイントを詳しく解説します。アシックス、ミズノ、ナースリーなど人気ブランドを比較。'

  // Tagsを生成
  const tags = ['シューズ', '靴', 'グッズ', '必要なもの', '準備', '快適', '疲れない']

  // Draftとして投稿
  const doc = {
    _type: 'post',
    title,
    slug: { _type: 'slug', current: slug },
    excerpt,
    metaDescription,
    body,
    categories: categories ? [{ _type: 'reference', _ref: categories._id, _key: randomUUID() }] : [],
    tags,
    publishedAt: new Date().toISOString()
  }

  try {
    const result = await client.create(doc)
    console.log('\n✅ 記事作成完了！')
    console.log(`Draft ID: ${result._id}`)
    console.log(`編集URL: https://prorenata.jp/studio/structure/post;${result._id}`)
    console.log(`\nプレビューURL: https://prorenata.jp/posts/${slug}`)
    console.log('\n📊 記事情報:')
    console.log(`- 文字数: 約${body.filter(b => b._type === 'block' && b.style === 'normal').map(b => b.children.map(c => c.text).join('')).join('').length}文字`)
    console.log(`- H2見出し: ${body.filter(b => b.style === 'h2').length}個`)
    console.log(`- H3見出し: ${body.filter(b => b.style === 'h3').length}個`)
    console.log(`- Amazonリンク: ${amazonBlocks ? '✓' : '✗'}`)
    console.log(`- 楽天リンク: ${rakutenBlocks ? '✓' : '✗'}`)
    console.log(`- ナースリーリンク: ${nurseryBlocks ? '✓' : '✗'}`)
  } catch (error) {
    console.error('❌ エラー:', error.message)
    throw error
  }
}

createShoesArticle()
