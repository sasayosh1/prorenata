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
    /^20[歳才]の?現役?看護助手(が教える)?[：:、\s-]*/i,
    /^20[歳才]看護助手(が教える)?[：:、\s-]*/i,
    /^看護助手セラが教える[：:、\s-]*/i,
    /^セラが教える[：:、\s-]*/i,
    /^わたしが教える[：:、\s-]*/i,
  ];

  for (const p of patterns) {
    result = result.replace(p, '');
  }

  return result.trim();
}

// タイトル以外（excerpt/meta）からも年齢自己紹介フレーズを削除
export function sanitizePersonaText(text: string): string {
  if (!text) return text;

  const patterns = [
    /20[歳才]の?現役?看護助手(が教える)?/gi,
    /20[歳才]看護助手(が教える)?/gi,
    /20代看護助手(が教える)?/gi,
    /看護助手セラが教える/gi,
    /セラが教える/gi,
    /わたしが教える/gi,
    /私が教える/gi,
  ];

  let result = text;
  for (const p of patterns) {
    result = result.replace(p, '');
  }

  // 不要な句読点や連続スペースを整理
  result = result.replace(/^[：:、\s-]+/, '').replace(/\s{2,}/g, ' ').trim();
  return result;
}
