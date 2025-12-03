import { NextResponse } from "next/server";
import { searchLocalArticles } from "@/lib/localArticleSearch";

const greet =
  "こんにちは！ご相談や気になるテーマがあれば教えてください。記事検索やカテゴリからも探せます。";

const suggestionKeywords = [
  "資格 取得方法",
  "夜勤のコツ",
  "給料 明細 例",
  "退職 手続き",
  "人間関係 ストレス",
  "シフト調整 コツ",
];

const buildSuggestionResponse = () =>
  [
    "まだ記事が見つかりませんでしたが、次のキーワードがおすすめです。",
    ...suggestionKeywords.map((k, i) => `${i + 1}. 「${k}」`),
    "気になるキーワードを入れてみてくださいね。",
  ].join("\n");

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        const text = typeof message === "string" ? message.trim() : "";
        if (!text) {
            return NextResponse.json({ response: greet });
        }

        const wantsUrl =
            /url|リンク|link|教えて|知りたい/i.test(text);

        // ヒントを求める質問への即応答
        if (/おすすめ|キーワード|何を聞けば|どう聞く/i.test(text)) {
            return NextResponse.json({ response: buildSuggestionResponse() });
        }

        const hits = searchLocalArticles(text, 3);

        if (hits.length === 0) {
            return NextResponse.json({ response: buildSuggestionResponse() });
        }

        const lines = [
            "おすすめ記事をまとめました！",
            ...hits.map((h, idx) => {
                const titleLine = `${idx + 1}. 「${h.title}」`;
                const urlLine = wantsUrl ? `→ ${h.url}` : "";
                return urlLine ? `${titleLine}\n${urlLine}` : titleLine;
            }),
            wantsUrl
                ? "リンクから直接ご覧ください。"
                : "気になるタイトルをタップしてみてくださいね！（URLが必要なときは「URLを教えて」と聞いてください）",
        ];

        return NextResponse.json({ response: lines.join("\n") });
    } catch (error) {
        console.error("Chat error:", error);
        return NextResponse.json(
            {
                response:
                    "ごめんなさい、少し調子が悪いみたいです。記事検索やカテゴリから探してみてください。"
            }
        );
    }
}
