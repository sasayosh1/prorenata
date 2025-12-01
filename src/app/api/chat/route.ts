import { NextResponse } from "next/server";
import { searchLocalArticles } from "@/lib/localArticleSearch";

const greet =
  "こんにちは！ご相談や気になるテーマがあれば教えてください。記事検索やカテゴリからも探せます。";

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        const text = typeof message === "string" ? message.trim() : "";
        if (!text) {
            return NextResponse.json({ response: greet });
        }

        const wantsUrl =
            /url|リンク|link|教えて|知りたい/i.test(text);

        const hits = searchLocalArticles(text, 3);

        if (hits.length === 0) {
            const fallback =
                "該当記事が見つかりませんでした。別のキーワードをお試しください。例えば「資格」「夜勤」「給料」など。";
            return NextResponse.json({ response: fallback });
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
