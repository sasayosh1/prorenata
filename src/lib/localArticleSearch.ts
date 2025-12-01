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
