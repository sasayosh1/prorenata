import nodemailer from "nodemailer";
import { pickPostFromSanity } from "./sanity-fetch.mjs";

const MAX_LEN = 140;

function must(name, v) {
  if (!v || String(v).trim() === "") {
    throw new Error(`Missing env: ${name}`);
  }
  return v;
}

function normalize(s) {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

function truncate(s, n) {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}

/**
 * X投稿用テキストを生成（140文字以内）
 */
function buildXPost({ title, comment, url }) {
  title = normalize(title);
  comment = normalize(comment);
  url = normalize(url);

  // 改行2つ分を想定
  const reserved = url.length + 2; // "\n\n"
  const available = MAX_LEN - reserved;

  // タイトル＋コメントで使える文字数
  const titleMax = Math.min(available, 60);
  const commentMax = Math.max(0, available - titleMax - 1);

  const t = truncate(title, titleMax);
  const c = commentMax > 0 ? truncate(comment, commentMax) : "";

  return c
    ? `${t}\n${c}\n${url}`
    : `${t}\n${url}`;
}

async function main() {
  const gmailUser = must("GMAIL_USER", process.env.GMAIL_USER);
  const appPass = must("GMAIL_APP_PASSWORD", process.env.GMAIL_APP_PASSWORD);
  const mailTo = must("MAIL_TO", process.env.MAIL_TO);
  const siteBaseUrl = must("SITE_BASE_URL", process.env.SITE_BASE_URL);
  const postType = process.env.POST_TYPE || "post";
  const mode = process.env.MODE || "fresh";

  const post = await pickPostFromSanity({
    mode,
    siteBaseUrl,
    postType,
  });

  const title = post.title;
  const comment =
    post.summary ||
    "これから働く人向けに、現場の流れをまとめました。";
  const url = post.url;

  const xText = buildXPost({ title, comment, url });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: appPass },
  });

  await transporter.sendMail({
    from: gmailUser,
    to: mailTo,
    subject: `[X投稿用｜${mode === "fresh" ? "朝" : "夜"}] ${truncate(title, 40)}`,
    text: xText,
  });

  console.log("=== X POST TEXT ===");
  console.log(xText);
  console.log("Length:", xText.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
