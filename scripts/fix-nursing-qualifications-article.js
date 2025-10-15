/**
 * nursing-assistant-qualifications-needed 記事改善スクリプト
 *
 * 改善内容:
 * 1. 箇条書きのみのセクションに説明文を追加
 * 2. まとめセクションを追加
 * 3. アフィリエイトリンクの整理（連続を避ける、記事内容に合致させる）
 */

const { createClient } = require('@sanity/client')

const SANITY_CONFIG = {
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
}

const client = createClient(SANITY_CONFIG)

async function fixArticle() {
  console.log('🔧 記事改善スクリプト開始\n')

  const articleId = 'VcGv9zZ6obDRZ14YHcUUw4'

  try {
    // 現在の記事を取得
    const article = await client.getDocument(articleId)
    console.log(`📄 記事取得: ${article.title}`)

    // 新しいbody配列を構築
    const newBody = []

    // 既存の本文をコピー（商品セクションまで）
    for (let i = 0; i < article.body.length; i++) {
      const block = article.body[i]

      // 「働き始める前に準備しておきたいもの」セクションの直前まで
      if (block._key === 'section-title-mpdg3rpf5') {
        break
      }

      // ヒューマンライフケアのリンクを削除（連続リンクを避ける）
      if (block._key === 'block-q4pd1swzu') {
        continue
      }

      newBody.push(block)
    }

    // --- 「働き始める前に準備しておきたいもの」セクション ---
    newBody.push({
      _type: 'block',
      _key: 'section-title-prepare',
      style: 'h2',
      children: [{ _type: 'span', text: '働き始める前に準備しておきたいもの', marks: [] }],
      markDefs: []
    })

    newBody.push({
      _type: 'block',
      _key: 'section-intro-prepare',
      style: 'normal',
      children: [{ _type: 'span', text: '看護助手として働き始める前に、以下のアイテムを準備しておくと初日から安心して業務に取り組めます。現場で長く快適に働くために、質の良いものを選びましょう。', marks: [] }],
      markDefs: []
    })

    // --- 商品1: アシックス ナースウォーカー ---
    newBody.push({
      _type: 'block',
      _key: 'product-title-shoes',
      style: 'h3',
      children: [{ _type: 'span', text: 'アシックス ナースウォーカー', marks: [] }],
      markDefs: []
    })

    newBody.push({
      _type: 'block',
      _key: 'product-benefit-shoes',
      style: 'normal',
      children: [{ _type: 'span', text: '長時間の立ち仕事でも足が疲れにくい医療現場専用設計のシューズです。', marks: [] }],
      markDefs: []
    })

    newBody.push({
      _type: 'block',
      _key: 'product-feature-intro-shoes',
      style: 'normal',
      children: [{ _type: 'span', text: 'アシックス ナースウォーカーは、医療現場での長時間勤務を想定して設計された専用シューズです。以下の特徴により、看護助手の方々の足元の安全と快適性をサポートします：', marks: [] }],
      markDefs: []
    })

    newBody.push({
      _type: 'block',
      _key: 'product-feature-0-shoes',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      children: [{ _type: 'span', text: '滑りにくいソール：病院特有の濡れた床面でも高いグリップ力を発揮し、転倒事故を防ぎます', marks: [] }],
      markDefs: []
    })

    newBody.push({
      _type: 'block',
      _key: 'product-feature-1-shoes',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      children: [{ _type: 'span', text: '疲労軽減クッション：12時間勤務でも足への負担を最小限に抑える高性能クッション搭載', marks: [] }],
      markDefs: []
    })

    newBody.push({
      _type: 'block',
      _key: 'product-feature-2-shoes',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      children: [{ _type: 'span', text: '通気性の良い素材：夏場の長時間着用でも蒸れにくく、常に快適な履き心地を保ちます', marks: [] }],
      markDefs: []
    })

    newBody.push({
      _type: 'block',
      _key: 'product-links-shoes',
      style: 'normal',
      children: [
        { _type: 'span', text: 'Amazonで見る', marks: ['link-amazon-shoes'] },
        { _type: 'span', text: ' [PR] | ', marks: [] },
        { _type: 'span', text: '楽天市場で見る', marks: ['link-rakuten-shoes'] },
        { _type: 'span', text: ' [PR]', marks: [] }
      ],
      markDefs: [
        {
          _type: 'link',
          _key: 'link-amazon-shoes',
          href: 'https://www.amazon.co.jp/s?k=%E3%82%A2%E3%82%B7%E3%83%83%E3%82%AF%E3%82%B9+%E3%83%8A%E3%83%BC%E3%82%B9%E3%82%A6%E3%82%A9%E3%83%BC%E3%82%AB%E3%83%BC&tag=ptb875pmj49-22'
        },
        {
          _type: 'link',
          _key: 'link-rakuten-shoes',
          href: '//af.moshimo.com/af/c/click?a_id=5207851&p_id=54&pc_id=54&pl_id=621'
        }
      ]
    })

    // --- 商品2: ナース専用メモ帳 ---
    newBody.push({
      _type: 'block',
      _key: 'product-title-notepad',
      style: 'h3',
      children: [{ _type: 'span', text: 'ナース専用メモ帳', marks: [] }],
      markDefs: []
    })

    newBody.push({
      _type: 'block',
      _key: 'product-benefit-notepad',
      style: 'normal',
      children: [{ _type: 'span', text: 'ポケットに入るサイズで患者情報を素早くメモできます。', marks: [] }],
      markDefs: []
    })

    newBody.push({
      _type: 'block',
      _key: 'product-feature-intro-notepad',
      style: 'normal',
      children: [{ _type: 'span', text: '看護助手の業務では、患者さんの状態や指示事項を正確にメモすることが重要です。このナース専用メモ帳は、医療現場での使用を前提に以下の機能を備えています：', marks: [] }],
      markDefs: []
    })

    newBody.push({
      _type: 'block',
      _key: 'product-feature-0-notepad',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      children: [{ _type: 'span', text: 'コンパクトサイズ：白衣のポケットに収まり、いつでもサッと取り出せる', marks: [] }],
      markDefs: []
    })

    newBody.push({
      _type: 'block',
      _key: 'product-feature-1-notepad',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      children: [{ _type: 'span', text: '防水加工：手洗いや消毒液で濡れても大丈夫な耐水性', marks: [] }],
      markDefs: []
    })

    newBody.push({
      _type: 'block',
      _key: 'product-feature-2-notepad',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      children: [{ _type: 'span', text: 'チェックリスト付き：業務の抜け漏れを防ぐタスク管理機能', marks: [] }],
      markDefs: []
    })

    newBody.push({
      _type: 'block',
      _key: 'product-links-notepad',
      style: 'normal',
      children: [
        { _type: 'span', text: 'Amazonで見る', marks: ['link-amazon-notepad'] },
        { _type: 'span', text: ' [PR] | ', marks: [] },
        { _type: 'span', text: '楽天市場で見る', marks: ['link-rakuten-notepad'] },
        { _type: 'span', text: ' [PR]', marks: [] }
      ],
      markDefs: [
        {
          _type: 'link',
          _key: 'link-amazon-notepad',
          href: 'https://www.amazon.co.jp/s?k=%E3%83%8A%E3%83%BC%E3%82%B9+%E3%83%A1%E3%83%A2%E5%B8%B3&tag=ptb875pmj49-22'
        },
        {
          _type: 'link',
          _key: 'link-rakuten-notepad',
          href: '//af.moshimo.com/af/c/click?a_id=5207851&p_id=54&pc_id=54&pl_id=621'
        }
      ]
    })

    // --- 商品3: ナース専用腕時計 ---
    newBody.push({
      _type: 'block',
      _key: 'product-title-watch',
      style: 'h3',
      children: [{ _type: 'span', text: 'ナース専用腕時計', marks: [] }],
      markDefs: []
    })

    newBody.push({
      _type: 'block',
      _key: 'product-benefit-watch',
      style: 'normal',
      children: [{ _type: 'span', text: '秒針付きで脈拍測定、防水仕様で手洗いも安心です。', marks: [] }],
      markDefs: []
    })

    newBody.push({
      _type: 'block',
      _key: 'product-feature-intro-watch',
      style: 'normal',
      children: [{ _type: 'span', text: '医療現場では脈拍測定や正確な時間管理が求められます。このナース専用腕時計は、看護助手の業務に必要な以下の機能を備えています：', marks: [] }],
      markDefs: []
    })

    newBody.push({
      _type: 'block',
      _key: 'product-feature-0-watch',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      children: [{ _type: 'span', text: '秒針付き：患者さんの脈拍を正確にカウントできる', marks: [] }],
      markDefs: []
    })

    newBody.push({
      _type: 'block',
      _key: 'product-feature-1-watch',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      children: [{ _type: 'span', text: '防水仕様：頻繁な手洗いや消毒にも耐える防水設計', marks: [] }],
      markDefs: []
    })

    newBody.push({
      _type: 'block',
      _key: 'product-feature-2-watch',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      children: [{ _type: 'span', text: '見やすい文字盤：忙しい業務中でも一目で時刻を確認可能', marks: [] }],
      markDefs: []
    })

    newBody.push({
      _type: 'block',
      _key: 'product-links-watch',
      style: 'normal',
      children: [
        { _type: 'span', text: 'Amazonで見る', marks: ['link-amazon-watch'] },
        { _type: 'span', text: ' [PR] | ', marks: [] },
        { _type: 'span', text: '楽天市場で見る', marks: ['link-rakuten-watch'] },
        { _type: 'span', text: ' [PR]', marks: [] }
      ],
      markDefs: [
        {
          _type: 'link',
          _key: 'link-amazon-watch',
          href: 'https://www.amazon.co.jp/s?k=%E3%83%8A%E3%83%BC%E3%82%B9%E3%82%A6%E3%82%A9%E3%83%83%E3%83%81&tag=ptb875pmj49-22'
        },
        {
          _type: 'link',
          _key: 'link-rakuten-watch',
          href: '//af.moshimo.com/af/c/click?a_id=5207851&p_id=54&pc_id=54&pl_id=621'
        }
      ]
    })

    // --- まとめセクション ---
    newBody.push({
      _type: 'block',
      _key: 'summary-title',
      style: 'h2',
      children: [{ _type: 'span', text: 'まとめ：資格がなくても看護助手として活躍できる', marks: [] }],
      markDefs: []
    })

    newBody.push({
      _type: 'block',
      _key: 'summary-para1',
      style: 'normal',
      children: [{ _type: 'span', text: '看護助手は、資格や経験がなくても挑戦できる医療職です。多くの病院や施設では未経験者向けの研修制度が整っており、安心してキャリアをスタートできます。ただし、介護職員初任者研修や介護福祉士などの資格を持っていると、就職・転職で有利になり、給与アップにもつながります。', marks: [] }],
      markDefs: []
    })

    newBody.push({
      _type: 'block',
      _key: 'summary-para2',
      style: 'normal',
      children: [{ _type: 'span', text: 'まずは無資格・未経験から始めて、働きながら資格取得を目指すのが現実的なキャリアパスです。この記事で紹介した準備アイテムを揃えて、看護助手としての第一歩を踏み出しましょう。', marks: [] }],
      markDefs: []
    })

    // --- 転職リンク（1つのみ、まとめの後） ---
    newBody.push({
      _type: 'block',
      _key: 'affiliate-job',
      style: 'normal',
      children: [
        { _type: 'span', text: '💼 看護助手・介護職の求人をお探しの方へ： ', marks: [] },
        { _type: 'span', text: '未経験歓迎の求人多数「ヒューマンライフケア」', marks: ['link-humanlifecare'] }
      ],
      markDefs: [
        {
          _type: 'link',
          _key: 'link-humanlifecare',
          href: '//af.moshimo.com/af/c/click?a_id=5207863&p_id=6140&pc_id=17239&pl_id=78717'
        }
      ]
    })

    // 記事を更新
    await client
      .patch(articleId)
      .set({ body: newBody })
      .commit()

    console.log('\n✅ 記事改善完了!')
    console.log('\n改善内容:')
    console.log('  1. 箇条書きに説明文を追加（3箇所）')
    console.log('  2. まとめセクションを追加')
    console.log('  3. アフィリエイトリンクを整理（連続リンクを削除、記事内容に合致）')
    console.log('  4. 不要なリンクを削除（パソナ、リニューケア、汐留パートナーズ）')
    console.log('  5. 転職リンクを1つに集約（まとめの後に配置）')

  } catch (error) {
    console.error('\n❌ エラー:', error)
    process.exit(1)
  }
}

fixArticle()
