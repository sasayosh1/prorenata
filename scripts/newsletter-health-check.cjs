#!/usr/bin/env node
/**
 * newsletter-health-check.cjs
 *
 * メルマガシステムのヘルスチェック。毎日 send-step-emails.yml から実行。
 * 以下を検査し、問題があれば管理者メールに通知する。
 *
 * 検査項目:
 *   1. 環境変数の存在
 *   2. Sanity 接続 & 購読者取得
 *   3. テンプレートファイルの存在確認
 *   4. Gmail SMTP 接続確認
 *   5. 購読者ごとのステップ進捗レポート
 *   6. ニュースレター本文完全性チェック（新規 2026-04-04）
 */

'use strict'

const { createClient } = require('@sanity/client')
const nodemailer = require('nodemailer')
const fs = require('fs/promises')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local'), override: true })

// ── 設定 ──────────────────────────────────────────────────────────────────────
const MAIL_USER  = process.env.MAIL_USER
const MAIL_PASS  = process.env.MAIL_PASS
const MAIL_TO    = process.env.MAIL_TO || MAIL_USER   // 管理者宛先（未設定ならself）
const SANITY_TOKEN = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN

const STEP_FILES = {
  2: '02_7日前_告知開始.md',
  3: '03_6日前_制作秘話.md',
  4: '04_5日前_特典公開.md',
  5: '05_4日前_感情共有.md',
  6: '06_3日前_期待感.md',
  7: '07_2日前_最終確認.md',
  8: '08_当日_リリース.md',
}
const EMAIL_DIR   = path.join(__dirname, '../06_メルマガ/ローンチメール')
const TOTAL_STEPS = 8

// ── ユーティリティ ────────────────────────────────────────────────────────────
const errors   = []
const warnings = []
const info     = []

function addError(msg)   { errors.push(msg);   console.error('❌', msg) }
function addWarning(msg) { warnings.push(msg); console.warn ('⚠️ ', msg) }
function addInfo(msg)    { info.push(msg);     console.log  ('✅', msg) }

// ── 検査 1: 環境変数 ──────────────────────────────────────────────────────────
function checkEnvVars() {
  console.log('\n[1/5] 環境変数チェック...')
  const required = { MAIL_USER, MAIL_PASS, SANITY_TOKEN }
  for (const [key, val] of Object.entries(required)) {
    if (!val) addError(`環境変数 ${key} が未設定です`)
    else      addInfo(`${key} 設定済み`)
  }
}

// ── 検査 2: Sanity 接続 ────────────────────────────────────────────────────────
async function checkSanity() {
  console.log('\n[2/5] Sanity 接続チェック...')
  if (!SANITY_TOKEN) {
    addError('Sanity トークン未設定のためスキップ')
    return null
  }

  const client = createClient({
    projectId : process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset   : process.env.NEXT_PUBLIC_SANITY_DATASET    || 'production',
    useCdn    : false,
    apiVersion: '2024-01-01',
    token     : SANITY_TOKEN,
  })

  try {
    const subscribers = await client.fetch(
      `*[_type == "subscriber" && !defined(unsubscribedAt)] | order(subscribedAt asc) { _id, email, subscribedAt, lastStepSent }`
    )
    addInfo(`Sanity 接続OK — アクティブ購読者: ${subscribers.length} 名`)
    return { client, subscribers }
  } catch (err) {
    addError(`Sanity 接続失敗: ${err.message}`)
    return null
  }
}

// ── 検査 3: テンプレートファイル ────────────────────────────────────────────────
async function checkTemplateFiles() {
  console.log('\n[3/5] テンプレートファイルチェック...')
  for (const [step, filename] of Object.entries(STEP_FILES)) {
    const filePath = path.join(EMAIL_DIR, filename)
    try {
      await fs.access(filePath)
      // 件名行が存在するか簡易確認
      const content = await fs.readFile(filePath, 'utf-8')
      if (!content.includes('件名：')) {
        addWarning(`Step ${step} (${filename}): 「件名：」行が見つかりません`)
      } else {
        addInfo(`Step ${step}: ${filename} OK`)
      }
    } catch {
      addError(`Step ${step}: ファイルが見つかりません → ${filename}`)
    }
  }
}

// ── 検査 4: Gmail SMTP 接続 ────────────────────────────────────────────────────
async function checkSmtp() {
  console.log('\n[4/5] Gmail SMTP 接続チェック...')
  if (!MAIL_USER || !MAIL_PASS) {
    addError('メール認証情報未設定のためスキップ')
    return null
  }
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: MAIL_USER, pass: MAIL_PASS },
  })
  try {
    await transporter.verify()
    addInfo(`Gmail SMTP 接続OK (${MAIL_USER})`)
    return transporter
  } catch (err) {
    addError(`Gmail SMTP 接続失敗: ${err.message}`)
    return null
  }
}

// ── 検査 5: 購読者ステップ進捗 ────────────────────────────────────────────────
function checkSubscriberProgress(subscribers) {
  console.log('\n[5/5] 購読者ステップ進捗チェック...')
  if (!subscribers || subscribers.length === 0) {
    addInfo('購読者なし')
    return []
  }

  const now = Date.now()
  const report = []

  for (const sub of subscribers) {
    const subscribedAt  = new Date(sub.subscribedAt).getTime()
    const daysElapsed   = Math.floor((now - subscribedAt) / (1000 * 60 * 60 * 24))
    const lastStepSent  = sub.lastStepSent ?? 1
    const nextStep      = lastStepSent + 1
    const isCompleted   = lastStepSent >= TOTAL_STEPS

    // ステップが止まっていないか検知
    // 「本来送られていたはずのステップ」= daysElapsed + 1 (step1=day0, step2=day1...)
    const expectedMaxStep = Math.min(daysElapsed + 1, TOTAL_STEPS)
    const stepLag = expectedMaxStep - lastStepSent

    const entry = {
      email      : sub.email,
      daysElapsed,
      lastStepSent,
      nextStep   : isCompleted ? '完了' : nextStep,
      stepLag,
      status     : 'OK',
    }

    if (isCompleted) {
      entry.status = '配信完了'
      addInfo(`${sub.email}: 全ステップ配信完了`)
    } else if (stepLag > 1) {
      entry.status = `遅延（${stepLag}ステップ未送信）`
      addWarning(`${sub.email}: ステップ遅延 — 期待Step${expectedMaxStep} vs 実績Step${lastStepSent}`)
    } else {
      addInfo(`${sub.email}: Step${lastStepSent}送信済 / 経過${daysElapsed}日 / 次Step${nextStep}`)
    }

    report.push(entry)
  }

  return report
}

// ── 検査 6: ニュースレター本文完全性（新規 2026-04-04） ─────────────────────────
async function checkNewsletterCompletion(sanityData) {
  console.log('\n[6/6] ニュースレター本文完全性チェック...')

  if (!sanityData || !sanityData.client) {
    addError('Sanity接続がないためスキップ')
    return []
  }

  try {
    const newsletters = await sanityData.client.fetch(
      `*[_type == "newsletter"] | order(emailNumber asc) {
        _id, subject, emailNumber, body
      }`
    )

    if (newsletters.length === 0) {
      addInfo('ニュースレター文書なし')
      return []
    }

    const report = []

    for (const nl of newsletters) {
      const blockCount = nl.body ? nl.body.length : 0
      const headingCount = nl.body ? nl.body.filter(b => b.style && b.style.startsWith('h')).length : 0

      const entry = {
        emailNumber: nl.emailNumber,
        subject: nl.subject,
        blockCount,
        headingCount,
        status: 'OK',
      }

      // 本文が空の場合
      if (!nl.body || blockCount === 0) {
        entry.status = 'ERROR: 本文が空です'
        addError(`Newsletter #${nl.emailNumber} "${nl.subject}": 本文が空（ブロック数: 0）`)
      }
      // ブロック数が疑わしい場合（< 10）
      else if (blockCount < 10) {
        entry.status = `WARNING: ブロック数が少ない（${blockCount}）`
        addWarning(`Newsletter #${nl.emailNumber} "${nl.subject}": ブロック数 ${blockCount} < 基準10`)
      }
      // 見出しが基準以下の場合（< 3）
      else if (headingCount < 3) {
        entry.status = `WARNING: 見出しが少ない（${headingCount}）`
        addWarning(`Newsletter #${nl.emailNumber} "${nl.subject}": H2見出し ${headingCount} < 基準3`)
      }
      // 正常
      else {
        addInfo(`Newsletter #${nl.emailNumber}: ${blockCount}ブロック / H2見出し${headingCount}個 — OK`)
      }

      report.push(entry)
    }

    return report
  } catch (err) {
    addError(`ニュースレター取得失敗: ${err.message}`)
    return []
  }
}

// ── アラートメール送信 ──────────────────────────────────────────────────────────
async function sendAlertEmail(transporter, subscriberReport, newsletterReport) {
  if (errors.length === 0 && warnings.length === 0) return

  const lines = [
    '【ProReNata メルマガ ヘルスチェック アラート】',
    `実行日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })} JST`,
    '',
  ]

  if (errors.length > 0) {
    lines.push('■ エラー（要対応）')
    errors.forEach(e => lines.push(`  ❌ ${e}`))
    lines.push('')
  }
  if (warnings.length > 0) {
    lines.push('■ 警告')
    warnings.forEach(w => lines.push(`  ⚠️  ${w}`))
    lines.push('')
  }
  if (subscriberReport.length > 0) {
    lines.push('■ 購読者ステータス')
    subscriberReport.forEach(s => {
      lines.push(`  ${s.email} | ${s.daysElapsed}日経過 | Step${s.lastStepSent}送信済 | ${s.status}`)
    })
    lines.push('')
  }
  if (newsletterReport.length > 0) {
    lines.push('■ ニュースレター本文チェック')
    newsletterReport.forEach(nl => {
      lines.push(`  #${nl.emailNumber} "${nl.subject}" | ブロック${nl.blockCount} / 見出し${nl.headingCount} | ${nl.status}`)
    })
    lines.push('')
  }
  lines.push('--- GitHub Actions ログで詳細を確認してください ---')

  if (!transporter) {
    console.error('SMTPが利用不可のためアラートメール送信スキップ')
    console.log(lines.join('\n'))
    return
  }

  try {
    await transporter.sendMail({
      from   : `"ProReNata System" <${MAIL_USER}>`,
      to     : MAIL_TO,
      subject: `[要確認] メルマガシステム アラート ${errors.length}件のエラー`,
      text   : lines.join('\n'),
    })
    console.log(`\nアラートメール送信済 → ${MAIL_TO}`)
  } catch (err) {
    console.error('アラートメール送信失敗:', err.message)
  }
}

// ── メイン ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== メルマガ ヘルスチェック開始 ===')

  checkEnvVars()
  const sanityResult   = await checkSanity()
  await checkTemplateFiles()
  const transporter    = await checkSmtp()
  const subscriberReport = checkSubscriberProgress(sanityResult?.subscribers)
  const newsletterReport = await checkNewsletterCompletion(sanityResult)

  console.log('\n=== 結果サマリー ===')
  console.log(`エラー: ${errors.length} 件`)
  console.log(`警告  : ${warnings.length} 件`)
  console.log(`情報  : ${info.length} 件`)
  console.log(`\nニュースレター: ${newsletterReport.length} 件確認`)

  if (errors.length > 0 || warnings.length > 0) {
    await sendAlertEmail(transporter, subscriberReport, newsletterReport)
  } else {
    console.log('\n✅ すべて正常です')
  }

  // エラーがあれば exit code 1 でワークフローを失敗扱いにする
  if (errors.length > 0) process.exit(1)
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
