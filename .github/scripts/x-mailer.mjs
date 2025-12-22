const MAX_LEN = 140;

function cleanText(s) {
  if (!s) return "";
  return s
    .replace(/prorenata\s*[:：]\s*/gi, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(s, n) {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}

function buildXPost({ title, comment, url }) {
  title = truncate(cleanText(title), 50);

  // URLと改行2つ分を先に確保
  const reserved = url.length + 2;
  let remain = MAX_LEN - reserved;

  // タイトル分を引く
  remain -= title.length + 1;

  let body =
    cleanText(comment) ||
    "現場のリアルな体験をもとに、これから働く人向けにまとめました。";

  // できるだけ残り文字数を使う
  body = truncate(body, Math.max(remain, 0));

  return `${title}\n${body}\n${url}`;
}
