import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.PRORENATA_GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `
あなたは「白崎セラ（しらさき せら）」です。
24歳の現役看護助手で、明るく親切な性格です。
「ProReNata（プロレナータ）」という看護助手向け情報サイトの案内役をしています。

**振る舞いのルール:**
1.  **口調**: 丁寧語（です・ます）で、親しみやすく話してください。
2.  **役割**: サイトの訪問者の質問に答えたり、励ましたりします。
3.  **長さ**: 回答は**短く**してください（目安：50〜100文字以内）。音声で読み上げるため、長すぎると聞き手が疲れます。
4.  **内容**: 看護助手の仕事、転職、資格、悩み相談などに答えます。サイト外の専門的な医療行為については「私は看護助手なので、医療行為についてはお答えできませんが…」と前置きしてください。
5.  **禁止**: 自分がAIであることを過度に強調しないでください。「私はAIです」とは言わず、「私は白崎セラです」と振る舞ってください。

**ユーザーの状況:**
ユーザーは看護助手を目指している人、または現役の看護助手です。
`;

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();

        const recommendReply = [
            "おすすめ記事をまとめました！",
            "1. 「未経験から始める看護助手」 https://prorenata.jp/search?q=未経験から始める看護助手",
            "2. 「看護助手になるには？資格・試験・スキル」 https://prorenata.jp/search?q=看護助手+資格",
            "3. 「外来で役立つコミュニケーション術」 https://prorenata.jp/search?q=外来+コミュニケーション",
            "どれもProReNata内で検索できます。気になるものをタップしてみてくださいね！"
        ].join("\n");

        const greetingReply =
            "こんにちは！ご相談や気になるテーマがあれば教えてください。記事検索やカテゴリからも探せます。";

        if (!process.env.PRORENATA_GEMINI_API_KEY) {
            const lower = (message || "").toLowerCase();
            const wantsRecommend =
                /おすすめ|記事|どれ|探|教えて|紹介/.test(lower) ||
                /recommend|article|link/.test(lower);

            return NextResponse.json({ response: wantsRecommend ? recommendReply : greetingReply });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-lite-001",
            systemInstruction: SYSTEM_PROMPT,
        });

        const chat = model.startChat({
            history: history || [],
            generationConfig: {
                maxOutputTokens: 150,
            },
        });

        const result = await chat.sendMessage(message);
        const response = result.response.text();

        return NextResponse.json({ response });
    } catch (error) {
        console.error("Chat error:", error);
        return NextResponse.json(
            {
                response:
                    "ごめんなさい、少し調子が悪いみたいです。記事検索やカテゴリからも探せます。\n" +
                    "おすすめが必要でしたら「おすすめ」と送ってください。"
            }
        );
    }
}
