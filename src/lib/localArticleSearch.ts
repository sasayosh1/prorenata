import articlesData from "../../all-articles.json";

type ArticleRecord = {
  title?: string;
  slug?: string;
  categories?: string[];
  bodyPlainText?: string;
};

const articles: ArticleRecord[] = Array.isArray(articlesData) ? (articlesData as ArticleRecord[]) : [];

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[！!？?。、,.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// シンプルなカテゴリキーワード辞書（無料検索強化用）
const categoryKeywords: Record<string, string[]> = {
  "夜勤": ["夜勤", "ナイト", "シフト", "仮眠", "休憩"],
  "給料": ["給料", "給与", "年収", "手当", "昇給", "ボーナス", "賞与"],
  "人間関係": ["人間関係", "人間 関係", "先輩", "同僚", "パワハラ", "ストレス"],
  "退職": ["退職", "辞め", "やめ", "転職", "離職", "退職代行"],
  "資格": ["資格", "講座", "研修", "勉強", "合格", "受験"]
};

export type ArticleHit = {
  title: string;
  url: string;
  snippet: string;
  categories: string[];
};

export function searchLocalArticles(query: string, limit = 3): ArticleHit[] {
  const q = normalize(query);
  if (!q) return [];
  const terms = q.split(" ").filter(Boolean);
  if (!terms.length) return [];

  // カテゴリ候補（ベタなマッチだが無料で精度を上げる）
  const categoryBoosts = new Set<string>();
  for (const [cat, kws] of Object.entries(categoryKeywords)) {
    if (kws.some(k => q.includes(normalize(k)))) {
      categoryBoosts.add(cat);
    }
  }

  const scored = articles
    .filter((a) => a.title && a.slug)
    .map((a) => {
      const haystack = normalize(`${a.title} ${(a.categories || []).join(" ")} ${a.bodyPlainText || ""}`);
      let score = 0;
      for (const term of terms) {
        if (haystack.includes(term)) {
          score += 2;
        }
        if (a.title && a.title.toLowerCase().includes(term)) {
          score += 3;
        }
      }

      // カテゴリ一致を少し加点
      const articleCats = (a.categories || []).map(c => normalize(c));
      for (const cat of categoryBoosts) {
        if (articleCats.some(c => c.includes(normalize(cat)))) {
          score += 3;
        }
      }

      return { article: a, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ article }) => {
    const title = article.title || "";
    const url = `https://prorenata.jp/posts/${article.slug}`;
    const snippet = article.bodyPlainText
      ? article.bodyPlainText.slice(0, 160) + (article.bodyPlainText.length > 160 ? "…" : "")
      : title;
    return {
      title,
      url,
      snippet,
      categories: article.categories || [],
    };
  });
}
