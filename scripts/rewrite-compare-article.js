#!/usr/bin/env node
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const { createMoshimoLinkBlocks } = require('./moshimo-affiliate-links')
const crypto = require('crypto')

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

function block(text, { style = 'normal', listItem, level } = {}) {
  return {
    _type: 'block',
    _key: crypto.randomUUID(),
    style,
    listItem,
    level,
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: crypto.randomUUID(),
        marks: [],
        text,
      },
    ],
  }
}

function bullet(text) {
  return block(text, { style: 'normal', listItem: 'bullet', level: 1 })
}

function heading(value) {
  return block(value, { style: 'h2' })
}

function embedWithoutCta(key, context) {
  const blocks = createMoshimoLinkBlocks(key, context) || []
  if (blocks.length >= 2) {
    return blocks.slice(1)
  }
  return blocks
}

async function main() {
  const slug = 'nursing-assistant-compare-services-perspective'
  const doc = await client.fetch('*[_type == "post" && slug.current == $slug][0]{ _id }', { slug })
  if (!doc?._id) {
    console.error('対象記事が見つかりません')
    process.exit(1)
  }

  const body = []
  body.push(
    block('看護助手として転職を考えるとき、求人票だけでは分からない支援内容や担当者の対応力が気になります。'),
    block('この記事では、看護助手向けの相談先として実際に利用されている「ヒューマンライフケア」「リニューケア」「かいご畑」の３サービスを、現場視点で比較しました。')
  )

  body.push(heading('１．サービスの特徴をざっくり比較'))
  body.push(
    block('それぞれの強みを押さえると、どこに相談すれば自分の悩みが解決しやすいかイメージできます。')
  )
  body.push(
    bullet('ヒューマンライフケア：全国の医療法人・介護施設と取引があり、教育制度や福利厚生の細部まで代わりに確認してくれる。'),
    bullet('リニューケア：関西圏や都市部の非公開求人が中心。夜勤回数や給与交渉など、細かな条件を詰めたいときに頼りになる。'),
    bullet('かいご畑：無資格・未経験でも応募しやすい求人が多く、資格取得支援を受けながらステップアップできる。')
  )

  body.push(
    block('[PR] 教育制度まで丁寧に確認してほしいときは、ヒューマンライフケアに希望条件を預けてみてください。 ヒューマンライフケアの求人サポートを見る'),
    ...embedWithoutCta('humanlifecare', 'サービスの特徴')
  )

  body.push(
    block('[PR] 関西圏や都市部で交渉を任せたいなら、リニューケアに希望の夜勤回数や給与レンジを整理して伝えると調整がスムーズです。 リニューケアの転職支援に相談する'),
    ...embedWithoutCta('renewcare', 'サービスの特徴')
  )

  body.push(
    block('[PR] 無資格・未経験からじっくり準備したい場合は、かいご畑の資格支援付き求人をチェックしてみてください。 かいご畑で介護職・看護助手の求人を探す'),
    ...embedWithoutCta('kaigobatake', 'サービスの特徴')
  )

  body.push(heading('２．料金と契約のしくみ'))
  body.push(
    block('３サービスとも、登録者から費用を取らずに病院や施設側から報酬を得る完全無料型です。そのため、面談・求人紹介・書類添削・面接日程の調整まで一貫して任せられます。'),
    bullet('紹介先との雇用形態：ヒューマンライフケアとリニューケアは正社員・契約社員の紹介が中心。かいご畑は派遣や紹介予定派遣も柔軟に提案。'),
    bullet('契約更新の手続き：派遣で働く場合は、かいご畑が勤務状況をヒアリングしながら更新時期をフォロー。正社員入職の場合は、ヒューマンライフケアやリニューケアが内定後の条件書を確認してくれる。'),
    bullet('サポート終了のタイミング：入職後も相談できる期間があるので、ミスマッチを感じたら早めに担当者に共有しておくと対応が早い。')
  )

  body.push(heading('３．登録から入職までの流れ'))
  body.push(
    block('各社とも大きな流れは共通しています。事前に準備しておくと、面談がスムーズです。'),
    bullet('1. WebフォームやLINEで登録 → 面談日程を調整。勤務中なら夜勤明けの時間帯も相談可能。'),
    bullet('2. 担当者ヒアリング → 希望業務、通勤時間、残業の限度、夜勤回数など優先順位を整理。'),
    bullet('3. 求人紹介・面接調整 → 条件に合う求人を提案し、応募先と日程を組む。'),
    bullet('4. 面接対策と条件確認 → 面接前に想定質問や確認事項を共有し、内定後は書面の条件を一緒にチェック。'),
    bullet('5. 入職準備 → ロッカーや制服、勤務開始日の詳細を確認し、必要書類を提出。')
  )

  body.push(heading('４．サポート体制で見る３つの違い'))
  body.push(
    bullet('レスポンス：ヒューマンライフケアは日中の電話・メールが得意。リニューケアは夜間もLINE返信があり、シフト制の生活でも連絡が途切れにくい。'),
    bullet('条件交渉：給与や夜勤回数の調整はリニューケアが強み。福利厚生や教育体制の確認はヒューマンライフケアが細部までチェック。'),
    bullet('スキルアップ支援：かいご畑は「実務者研修」などの受講費用を一部負担してくれる求人があり、未経験でもステップアップしやすい。')
  )

  body.push(heading('５．それぞれが向いている人'))
  body.push(
    bullet('全国の医療法人や老健を幅広く比較したい → ヒューマンライフケア。教育制度や福利厚生を重視する人に向いている。'),
    bullet('都市部・関西圏で条件交渉をしっかり任せたい → リニューケア。夜勤回数や給与を細かく調整したい人におすすめ。'),
    bullet('無資格・未経験から経験を積みたい → かいご畑。派遣で働きつつ資格取得を目指したい人にフィット。')
  )

  body.push(heading('６．利用者の声とよくある質問'))
  body.push(
    bullet('「ヒューマンライフケアは面接同行が丁寧で、緊張しがちな自分でも話しやすかった」'),
    bullet('「リニューケアは深夜でもLINEで相談でき、夜勤型の生活リズムでもやり取りしやすかった」'),
    bullet('「かいご畑の派遣で半年働きながら実務者研修を受け、希望の病院に転職できた」')
  )
  body.push(
    block('Q. 複数サービスに登録しても失礼ではありませんか？ → 問題ありません。比較して自分に合う求人や担当者を選べます。'),
    block('Q. すぐ辞めたくなった場合は？ → 派遣契約なら更新前に担当者へ相談、正社員の場合も再度求人を紹介してもらえます。'),
    block('Q. 家族に相談しづらいのですが？ → 担当者にそのまま伝えれば、説明資料や面談のポイントを教えてくれます。')
  )

  body.push(heading('７．まとめと次のステップ'))
  body.push(
    block('看護助手の転職は、求人の数だけでなく担当者のサポート領域で成果が変わります。全国の情報を網羅したいならヒューマンライフケア、条件交渉を細かく進めたいならリニューケア、未経験から準備したいならかいご畑といったように、自分の優先順位に合わせて相談先を使い分けてください。'),
    block('希望条件をメモしたチェックリストを作っておくと、各サービスの面談で聞き忘れがなくなります。気になる施設があれば、通勤時間や夜勤の入り方まで具体的に質問して比較しましょう。'),
    block('３社とも無料で利用できるので、まずは連絡が取りやすい時間帯と希望条件を整理し、できるだけ早く情報を集めるのが成功の近道です。')
  )

  await client.patch(doc._id).set({ body }).commit()
  console.log('✅ 記事本文を更新しました')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
