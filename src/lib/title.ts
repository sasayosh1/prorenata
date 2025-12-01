export function sanitizeTitle(title: string): string {
  if (!title) return title;

  let result = title.trim();

  // 先頭の【...】を丸ごと除去
  result = result.replace(/^【[^】]*】\s*/, '');

  // よくあるペルソナ表現を除去
  const patterns = [
    /^20代未経験から始める[：:、\s-]*/i,
    /^20代看護助手が教える[：:、\s-]*/i,
    /^20代未経験でも安心[：:、\s-]*/i,
  ];

  for (const p of patterns) {
    result = result.replace(p, '');
  }

  return result.trim();
}
