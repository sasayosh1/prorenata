/**
 * Set the body of "看護助手が辞めたいと思ったら？退職の選択肢とサービス比較"
 * to the latest curated content (Portable Text).
 *
 * Usage:
 *   SANITY_API_TOKEN=xxx node scripts/set-quit-retirement-article.js
 */

const { createClient } = require('next-sanity')
const { randomUUID } = require('crypto')

const slug = 'nursing-assistant-quit-retirement'
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01'
const token = process.env.SANITY_API_TOKEN

if (!token) {
  console.error('Error: SANITY_API_TOKEN is not set.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
})

const k = () => randomUUID().replace(/-/g, '')
const block = (text, style = 'normal') => ({
  _type: 'block',
  _key: k(),
  style,
  markDefs: [],
  children: [{ _type: 'span', _key: k(), marks: [], text }],
})

// Content (text-only, headings via style)
const body = [
  block('イントロダクション', 'h2'),
  block('看護助手として「もう限界かも」と感じるのは珍しくありません。人手不足、夜勤続き、理不尽なやり取り…。そのしんどさは、あなた一人のせいではなく、現場の構造的な負荷が重なっているからです。ここでは、安心して退職に進むための選択肢とステップを、看護助手の目線で整理します。'),

  block('看護助手が辞めたいと感じるリアルな理由', 'h2'),
  block('給料が上がりにくく、責任や業務量に見合わないと感じる。人手不足で常に時間に追われ、休憩も取りづらい。コミュニケーションのすれ違いや指示の飛び交いで心が削られる。腰や膝など身体の痛みが蓄積し、夜勤で生活リズムが壊れる。どれもよくある悩みで、あなたが弱いわけではありません。'),

  block('退職を考えたらまずやるべき準備', 'h2'),
  block('・退職理由の整理：本音（負担、賃金、人間関係）と、伝える建前（家庭都合、キャリア見直し）を切り分ける。'),
  block('・有給残日数の確認と消化計画：退職日から逆算し、申請タイミングを早めに。'),
  block('・給与締め日、保険、離職票の確認：月末締めか、社保切替・雇用保険手続きのスケジュールを把握。'),
  block('・トラブル防止メモ：上司とのやり取り、引き継ぎ内容、シフト調整を簡単に記録。'),
  block('・信頼できる人に相談：同僚、家族、労組、専門窓口。感情の整理と第三者の視点を得る。'),

  block('看護助手が取れる3つの退職方法', 'h2'),
  block('自分で退職を伝える', 'h3'),
  block('費用ゼロで進められる。関係が極端に悪くなく、交渉に慣れている人向け。'),
  block('退職代行サービスを利用する', 'h3'),
  block('連絡や交渉を任せられる。即日退職を目指しやすく、上司と話すのが怖い／ハラスメントがある場合に有効。弁護士・労組運営を推奨。'),
  block('サポートを受けながら自分で伝える（セルフ退職）', 'h3'),
  block('テンプレや相談を受けつつ、自分名義で進める。コストは抑えたいが手順に不安がある人向け。'),
  block('比較の目安', 'h3'),
  block('・自分で伝える: 0円 / 即日性△ / 法的安心度△'),
  block('・退職代行: 数万円 / 即日性◎ / 法的安心度○〜◎（弁護士・労組なら◎）'),
  block('・セルフ退職: 低〜中コスト / 即日性○（テンプレ依存） / 安心度△〜○'),

  block('自分で退職を伝える場合のポイント', 'h2'),
  block('・伝え方テンプレ：「家庭の事情で○月末に退職を希望します。引き継ぎは文書で準備しますので、日程をご相談させてください。」'),
  block('・本音を建前に変える：人手不足→家庭都合・キャリア見直し、賃金不満→別分野で経験を積みたい。'),
  block('・引き止め回避：退職日は確定ベースで伝え、延長は難しいと先に言う。引き継ぎ内容と期限をセットで提示。'),
  block('・スケジュール：意思表明→退職日確定→引き継ぎ→有給消化→離職票・証明書の受領。'),

  block('退職代行サービスの安全性と選び方', 'h2'),
  block('・弁護士／労働組合を推奨：法的交渉や書類対応を適法に行える。'),
  block('・非弁業者のリスク：不当請求、手続き不備、トラブル時に対応できない。'),
  block('・医療現場で起こりがちなトラブル：有休消化の交渉、書類不備、引き継ぎ拒否など。'),
  block('・進行のイメージ：無料相談→申込・支払い→会社連絡（代行）→退職意思伝達→書類・精算確認→完了。'),

  block('安心して利用できる退職代行サービス比較（3社）', 'h2'),
  block('弁護士法人みやび（法的安心・全国対応）', 'h3'),
  block('料金: 16,500円（税込）。弁護士が直接対応し、未払賃金やハラスメント交渉も相談可。医療・介護の実績が多い。'),
  block('退職代行 即ヤメ（スピード・24時間相談）', 'h3'),
  block('料金: 15,000円（税込）。LINEで24時間相談でき、即日退職を目指しやすい。連絡を自分で取りたくない人向け。'),
  block('弁護士法人ガイア法律事務所（医療介護の相談実績）', 'h3'),
  block('料金: 14,000円（税込）。医療・介護案件の経験が多く、引き継ぎや手続きに配慮。LINE/メール相談可。'),
  block('推奨理由（公平・中立）', 'h3'),
  block('非弁リスクを避け、医療介護の相談実績と即日性・安心度を基準に3社を掲載。'),

  block('看護助手の退職後に必要な手続きまとめ', 'h2'),
  block('・健康保険の切り替え（国保 or 扶養）'),
  block('・雇用保険（失業給付）の手続き'),
  block('・退職証明書・源泉徴収票の受け取り'),
  block('・再就職・キャリアパス：介護職、医療事務、准看護師・看護師へのステップアップなど'),
  block('・資格取得の道筋：初任者研修、実務者研修、医療事務系資格'),

  block('よくある質問（FAQ）', 'h2'),
  block('Q: 即日退職はできる？ A: 代行を使えば可能性が高い。弁護士・労組系が安心。'),
  block('Q: 夜勤中でも辞められる？ A: 原則シフト調整後が望ましいが、体調や安全次第では早めに相談を。'),
  block('Q: 有給は使える？ A: 未消化分は取得を主張できる。退職日から逆算して計画的に申請を。'),
  block('Q: 退職後の職場の反応は？ A: 手続きが適法に済めば過度に気にしなくてOK。'),
  block('Q: トラブルが起きたら？ A: 記録を残し、弁護士・労組・信頼できる代行へ相談。非弁業者は避ける。'),

  block('まとめ：あなたの人生が最優先です', 'h2'),
  block('「辞めてもいい」「限界なら逃げてもいい」。あなたの健康と人生が最優先です。無料相談も活用し、無理をせず次の一歩へ進んでください。')
]

async function main() {
  const doc = await client.fetch(
    `*[_type == "post" && slug.current == $slug][0]{_id}`,
    { slug }
  )
  if (!doc?._id) {
    console.error('Post not found for slug:', slug)
    process.exit(1)
  }

  await client
    .patch(doc._id)
    .set({ body })
    .commit({ autoGenerateArrayKeys: false })

  console.log(`✅ Updated body for ${slug}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
