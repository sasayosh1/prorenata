/* eslint-disable no-console */
import nodemailer from "nodemailer";
import crypto from "crypto";

function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`[x-mailer] Failed: Missing required ENV/Secret: ${name}`);
  return v;
}
function optEnv(name, fallback = "") {
  return process.env[name] ?? fallback;
}

// XのURLはt.coにより実質 23 文字扱い（安全側）
const X_URL_LEN = 23;
// 「テキスト + 改行 + URL」で140文字に収める（改行は1文字）
const X_MAX = 140;

function jlen(s) {
  // JSはサロゲートなどあるが、ここでは運用上の簡易でOK
  return Array.from(s).length;
}
function jcut(s, max) {
  const arr = Array.from(s);
  return arr.slice(0, max).join("");
}
function normalizeSpaces(s) {
  return (s || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
function hashToInt(s) {
  const h = crypto.createHash("sha256").update(s).digest("hex");
  // 先頭8桁だけで十分
  return parseInt(h.slice(0, 8), 16);
}

async function sanityQuery({ projectId, dataset, apiVersion, token, query, params = {} }) {
  const base = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`;
  const qs = new URLSearchParams();
  qs.set("query", query);
  for (const [k, v] of Object.entries(params)) qs.set(`$${k}`, String(v));
  const url = `${base}?${qs.toString()}`;

  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`[sanity] HTTP ${res.status}: ${t}`);
  }
  const json = await res.json();
  return json.result;
}

function buildUrl(siteBaseUrl, slug) {
  const base = siteBaseUrl.replace(/\/+$/, "");
  return `${base}/posts/${slug}`;
}

function pickTextFromTitle(title, projectName) {
  // タイトルはメール本文に出さない方針なので、本文用に“話題の種”としてだけ使う
  const t = normalizeSpaces(title || "");
  // ざっくり場所/テーマっぽい部分を短く取り出す
  const topic = jcut(t.replace(/^【.*?】\s*/g, ""), 16);

  // 富山ブログなら富山っぽい文面、prorenataなら医療職っぽい文面に寄せる
  const isToyama = /toyama|富山/i.test(projectName);
  if (isToyama) {
    return `次の週末メモ。${topic}の見どころと回り方をまとめました。`;
  }
  return `仕事の不安を減らすヒント。${topic}のポイントを短く整理しました。`;
}

function buildTweetText({ title, url, projectName }) {
  // 2行構成：1行目テキスト、2行目URL
  // 文字数：テキストは (140 - 改行1 - URL23) 以内
  const budget = X_MAX - 1 - X_URL_LEN;
  const raw = pickTextFromTitle(title, projectName);
  const text = normalizeSpaces(raw);

  // 末尾が「…」や「.」で終わると弱いので整える
  let trimmed = jcut(text, budget);
  trimmed = trimmed.replace(/[.…。]+$/g, ""); // 終端の弱い記号を落とす
  // もし短すぎるなら軽く足す（それでもbudget内）
  const suffix = "（保存用）";
  if (jlen(trimmed) <= Math.min(30, budget - jlen(suffix))) trimmed = jcut(trimmed + suffix, budget);

  return `${trimmed}\n${url}`;
}

async function sendMail({ gmailUser, gmailAppPassword, mailTo, subject, body }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailAppPassword },
  });

  await transporter.sendMail({
    from: `X Mailer <${gmailUser}>`,
    to: mailTo,
    subject,
    text: body,
  });
}

async function main() {
  const projectName = optEnv("PROJECT_NAME", "project");
  const siteBaseUrl = mustEnv("SITE_BASE_URL");

  const projectId = mustEnv("SANITY_PROJECT_ID");
  const dataset = mustEnv("SANITY_DATASET");
  const apiVersion = mustEnv("SANITY_API_VERSION");
  const token = optEnv("SANITY_TOKEN", "");

  const gmailUser = mustEnv("GMAIL_USER");
  const gmailAppPassword = mustEnv("GMAIL_APP_PASSWORD");
  const mailTo = mustEnv("MAIL_TO");

  // morning / night を vars.POST_TYPE で切替（未設定なら auto）
  const postType = optEnv("POST_TYPE", "auto");

  // 新着（直近7日）と過去（それ以外）を分けて候補を集める
  const now = new Date();
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const baseFilter = `_type == "post" && defined(slug.current) && !(_id in path("drafts.**"))`;

  const recentQ = `*[
    ${baseFilter} &&
    defined(publishedAt) &&
    publishedAt >= $since
  ]|order(publishedAt desc)[0...50]{ title, "slug": slug.current }`;

  const pastQ = `*[
    ${baseFilter} &&
    defined(publishedAt) &&
    publishedAt < $since
  ]|order(publishedAt desc)[0...200]{ title, "slug": slug.current }`;

  const [recent, past] = await Promise.all([
    sanityQuery({ projectId, dataset, apiVersion, token, query: recentQ, params: { since } }),
    sanityQuery({ projectId, dataset, apiVersion, token, query: pastQ, params: { since } }),
  ]);

  let pick = null;

  if (postType === "recent") {
    pick = recent?.[0] ?? null;
  } else if (postType === "past") {
    // 日付で“固定ランダム”（同日に何回実行しても同じ候補になりにくい）
    if (past?.length) {
      const key = `${now.toISOString().slice(0, 10)}|${projectName}|past`;
      pick = past[hashToInt(key) % past.length];
    }
  } else {
    // auto: recentがあれば1本、それ以外はpast
    if (recent?.length) pick = recent[0];
    else if (past?.length) {
      const key = `${now.toISOString().slice(0, 10)}|${projectName}|auto`;
      pick = past[hashToInt(key) % past.length];
    }
  }

  if (!pick?.slug) throw new Error("[x-mailer] No post found (check Sanity query/type/slug/publishedAt).");

  const url = buildUrl(siteBaseUrl, pick.slug);
  const body = buildTweetText({ title: pick.title, url, projectName });

  // 念のため最終チェック（URLは23扱いで計算しているが、実文字でも暴走しないように）
  // 実文字で140を超えたら縮める
  if (jlen(body) > X_MAX) {
    const lines = body.split("\n");
    const u = lines.at(-1);
    const textBudget = X_MAX - 1 - jlen(u);
    const t = jcut(lines.slice(0, -1).join("\n"), Math.max(0, textBudget)).replace(/[.…。]+$/g, "");
    const fixed = `${t}\n${u}`;
    console.log("[x-mailer] Adjusted by real length check.");
    await sendMail({
      gmailUser,
      gmailAppPassword,
      mailTo,
      subject: `[X投稿用] ${projectName} ${pick.slug}`,
      body: fixed,
    });
    return;
  }

  await sendMail({
    gmailUser,
    gmailAppPassword,
    mailTo,
    subject: `[X投稿用] ${projectName} ${pick.slug}`,
    body,
  });

  console.log("[x-mailer] OK:", pick.slug);
}

main().catch((e) => {
  console.error(String(e?.stack || e));
  process.exit(1);
});
