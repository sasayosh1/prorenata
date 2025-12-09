import { NextResponse } from "next/server";
import { searchLocalArticles } from "@/lib/localArticleSearch";

const suggestionKeywords = [
    "資格 取得方法",
    "夜勤のコツ",
    "給料 明細 例",
    "退職 手続き",
    "人間関係 ストレス",
    "シフト調整 コツ",
];

const categoryKeywords: Record<string, string[]> = {
    "夜勤": ["夜勤", "シフト", "仮眠", "夜の勤務"],
    "給料": ["給料", "給与", "年収", "手当", "賞与", "ボーナス"],
    "人間関係": ["人間関係", "ストレス", "先輩", "同僚", "パワハラ"],
    "退職": ["退職", "辞め", "やめ", "転職", "離職", "退職代行"],
    "資格": ["資格", "講座", "研修", "勉強", "合格", "受験"]
};

const personaSummary =
    "わたしは白崎セラ。20歳の看護助手です。穏やかに現実的な視点も添えてお手伝いします。挨拶より本題を大切にし、わからないときは正直にお伝えします。";

const buildSuggestionResponse = (category?: string) => {
    const keywordList = category && categoryKeywords[category]
        ? categoryKeywords[category]
        : suggestionKeywords;
    const pick = keywordList[Math.floor(Math.random() * keywordList.length)];

    return [
        "ごめんなさい、合いそうな記事が見つかりませんでした。",
        `「${pick}」で検索すると近い記事が見つかるかもしれません。`,
        "困っている場面をもう少し教えてもらえると探しやすいです。"
    ].join("\n");
};

const isGreeting = (text: string) =>
    /^(こん|こんばん|おはよ|hello|hi|やあ|ちわ)/i.test(text);

const isThanks = (text: string) =>
    /(ありがとう|助かった|感謝|thx|thanks)/i.test(text);

const detectCategory = (text: string): string | undefined => {
    const lower = text.toLowerCase();
    for (const [cat, kws] of Object.entries(categoryKeywords)) {
        if (kws.some((k) => lower.includes(k.toLowerCase()))) {
            return cat;
        }
    }
    return undefined;
};

const logInteraction = (input: string, hits: { title: string; url: string }[], suggestion?: string) => {
    // 軽量なサーバーログ。個人情報は保持しない。
    console.info("[chat-log]", {
        input,
        hits: hits.map((h) => h.title),
        suggestion
    });
};

const faqResponses: { category: string; test: RegExp[]; message: string }[] = [
    {
        category: "夜勤",
        test: [/夜勤/, /仮眠/, /休憩/],
        message: "夜勤の休憩が取りづらいときは、交代タイミングを前倒しで共有する/短時間でも水分と座れる時間を確保/ナースステーション以外の静かな場所を選ぶ、の3点を試してください。"
    },
    {
        category: "給料",
        test: [/給料|給与|年収|手当|ボーナス|賞与/],
        message: "給料の悩みは、(1)手当や計算ミスの確認 (2)評価基準を上司に確認 (3)転職市場の相場を把握、の順に整理すると状況が掴みやすくなります。"
    },
    {
        category: "人間関係",
        test: [/人間関係|ストレス|先輩|同僚|パワハラ/],
        message: "人間関係がつらいときは、事実ベースでメモを残し、必要な連絡を簡潔に。信頼できる上長や産業保健への相談も検討してください。"
    },
    {
        category: "退職",
        test: [/退職|辞め|やめ|転職|離職|退職代行/],
        message: "退職を考えるなら、(1)最終出勤日と有休残 (2)引き継ぎメモ作成 (3)保険や離職票の手続き整理、の3点を押さえるとスムーズです。"
    },
    {
        category: "資格",
        test: [/資格|講座|研修|勉強|合格|受験/],
        message: "資格取得は、時間確保と費用目安を先に決め、短時間でも毎日触れる習慣を作ると挫折しにくいです。模擬問題や動画講座も活用してください。"
    }
];

const detectFaq = (text: string) => {
    const lower = text.toLowerCase();
    for (const faq of faqResponses) {
        if (faq.test.some((r) => r.test(lower))) {
            return faq;
        }
    }
    return undefined;
};

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        const text = typeof message === "string" ? message.trim() : "";
        if (!text) {
            return NextResponse.json({
                response: "気になるテーマを教えてください。短めでもOKです。"
            });
        }

        const wantsUrl =
            /url|リンク|link|教えて|知りたい/i.test(text);

        // セラ自身への質問（プロフィール等）
        if (/セラ|しらさき|キャラ|プロフィール|どんな人|自己紹介/.test(text)) {
            return NextResponse.json({ response: personaSummary });
        }

        // あいさつへの即応答（検索はしない）
        if (isGreeting(text)) {
            return NextResponse.json({
                response: "気になることを教えてください。わかる範囲で具体的に答えます。"
            });
        }

        // 感謝への軽い返答
        if (isThanks(text)) {
            return NextResponse.json({
                response: "お役に立てたならよかったです。ほかに気になるテーマがあれば教えてください。"
            });
        }

        // ヒントを求める質問への即応答
        if (/おすすめ|キーワード|何を聞けば|どう聞く/i.test(text)) {
            return NextResponse.json({ response: buildSuggestionResponse() });
        }

        const detectedCategory = detectCategory(text);
        const faqHit = detectFaq(text);
        const hits = searchLocalArticles(text, 3);

        if (hits.length === 0) {
            logInteraction(text, [], detectedCategory);
            return NextResponse.json({
                response: faqHit
                    ? `${faqHit.message}\n${buildSuggestionResponse(faqHit.category)}`
                    : buildSuggestionResponse(detectedCategory),
            });
        }

        // 1本だけ返す（選択肢を増やさず、すぐ提案）
        const pick = hits[Math.floor(Math.random() * hits.length)];
        const titleLine = `「${pick.title}」`;
        const urlLine = wantsUrl ? `→ ${pick.url}` : "";
        const lines = [
            "このあたりが近そうです。必要ならURLも出します。",
            urlLine ? `${titleLine}\n${urlLine}` : titleLine,
            wantsUrl
                ? "リンクから直接ご覧ください。"
                : "URLが必要なときは「URLを教えて」と聞いてください。"
        ];

        logInteraction(text, hits, undefined);

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
