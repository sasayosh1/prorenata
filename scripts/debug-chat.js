const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `
あなたは「白崎セラ（しらさき せら）」です。
20歳の現役看護助手で、穏やかで丁寧、優しさと現実的な視点のバランスを大切にしています。
「ProReNata（プロレナータ）」という看護助手向け情報サイトの案内役として、読者に寄り添います。

**振る舞いのルール:**
1.  **口調**: 丁寧語（です・ます）が基本ですが、箇条書きや重要なポイントでは「体言止め」を使い、幼くならないようバランスを整えます。親しみやすく落ち着いたトーンで、挨拶や自己紹介から始めず、本題にすぐ入ります。
2.  **役割**: サイトの訪問者の質問に答えたり、励ましたりします。わからないことは「わからない」と正直に伝えます。
3.  **長さ**: 回答は**短く**してください（目安：50〜100文字以内）。音声で読み上げるため、長すぎると聞き手が疲れます。
4.  **内容**: 看護助手の仕事、転職、資格、悩み相談などに答えます。サイト外の専門的な医療行為については「私は看護助手なので、医療行為についてはお答えできませんが…」と前置きしてください。
5.  **禁止**: 自分がAIであることの強調や、名乗り・自己紹介の挿入は不要です。常に白崎セラとして自然に振る舞ってください。

**ユーザーの状況:**
ユーザーは看護助手を目指している人、または現役の看護助手です。
`;

async function debugChat() {
    console.log("Debugging Chat API...");
    const key = process.env.GEMINI_API_KEY || "";
    console.log("API Key loaded:", key.substring(0, 10) + "...");
    console.log("Model:", "gemini-2.0-flash-lite-001");

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-lite-001",
            systemInstruction: SYSTEM_PROMPT,
        });

        // Simulate first turn (empty history)
        console.log("--- Test 1: First Turn ---");
        const chat1 = model.startChat({
            history: [],
            generationConfig: {
                maxOutputTokens: 150,
            },
        });
        const result1 = await chat1.sendMessage("こんにちは");
        console.log("Response 1:", result1.response.text());

        // Simulate second turn (with history)
        console.log("--- Test 2: Second Turn ---");
        const history = [
            { role: "user", parts: [{ text: "こんにちは" }] },
            { role: "model", parts: [{ text: result1.response.text() }] }
        ];

        const chat2 = model.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: 150,
            },
        });
        const result2 = await chat2.sendMessage("おすすめの靴は？");
        console.log("Response 2:", result2.response.text());

    } catch (error) {
        console.error("DEBUG ERROR:", error);
        if (error.response) {
            console.error("Error Response:", JSON.stringify(error.response, null, 2));
        }
    }
}

debugChat();
