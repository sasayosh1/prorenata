const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Configuration ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
if (!GEMINI_API_KEY) {
    console.error("FATAL: GEMINI_API_KEY is not set.");
    process.exit(1);
}

const WARDROBE_FILE_PATH = path.join(
    process.cwd(),
    'Library', 'Mobile Documents', 'iCloud~md~obsidian', 'Documents', 'sasayoshi',
    '00_System', '00_UserProfile', '08_セラのクローゼット(Sera_Wardrobe).md'
);

// Fallback path if run from inside the prorenata project dir directly vs home dir
const ALT_WARDROBE_PATH = path.join(process.env.HOME || '/Users/sasakiyoshimasa', 'Library/Mobile Documents/iCloud~md~obsidian/Documents/sasayoshi/00_System/00_UserProfile/08_セラのクローゼット(Sera_Wardrobe).md');
const finalPath = fs.existsSync(ALT_WARDROBE_PATH) ? ALT_WARDROBE_PATH : WARDROBE_FILE_PATH;


// --- Determine Season ---
const currentMonth = new Date().getMonth() + 1;
let targetSeason = "";
if (currentMonth >= 3 && currentMonth <= 5) {
    targetSeason = "春向け";
} else if (currentMonth >= 6 && currentMonth <= 8) {
    targetSeason = "夏向け";
} else if (currentMonth >= 9 && currentMonth <= 11) {
    targetSeason = "秋向け";
} else {
    targetSeason = "冬向け";
}

console.log(`🌸 Target Season determined: ${targetSeason} (Current Month: ${currentMonth})`);

// --- Prompt Definition ---
const generationPrompt = `
あなたは20代女性向けのファッショントレンドに精通したスタイリストです。
白崎セラ（20歳・女性・看護助手）のクローゼット（服装設定）の「${targetSeason}」の最新データを生成してください。

【セラのファッションルール（絶対厳守）】
1. 配色: 「淡色系（アイボリー、グレージュ、ペールブルー、ミントグリーンなど）」限定。原色や派手な柄はNG。
2. ブランドイメージ: VIS、ROPE' PICNIC、SNIDEL、gelato piqueなどのリアルな20代女性の清楚・リラックスカジュアル。おじさんっぽさや時代遅れ感は排除。
3. バッグ: 休日や通勤はサマンサタバサやFURLA系の、小さめ〜中くらいの淡色ハンドバッグ。

【出力フォーマット（厳守）】
以下のMarkdown構造と見出し（#や##のレベル）を完全に守って出力してください。余計な挨拶や前置きは不要です。Markdownテキストのみを出力してください。

# セラのクローゼット (Sera's Wardrobe Database)

このファイルは、白崎セラ（20代女性・看護助手）の具体的なファッション（服装・小物）を定義する辞書です。
AIによる画像生成や文章の情景描写の際、このファイルから季節・文脈に合ったアイテムを抽出してプロンプトに注入することで、常に「等身大でトレンド感のある20代女性」の現実感（バイブス）を維持します。

## 🎨 基本ルール (Style Rules)
*   **配色**: 淡色系（アイボリー、グレージュ、ペールブルー、ミントグリーンなど）。原色や派手な柄は避ける。
*   **テイスト**: 清潔感、リラックス、適度なトレンド感（VIS, ROPE' PICNIC, SNIDEL, gelato piqueなどを参考）。
*   **バッグ**: 休日や通勤はサマンサタバサやFURLA系の、小さめ〜中くらいの淡色ハンドバッグ。

---

## 👗 今季のワードローブ (${targetSeason})

### 💼 通勤・退勤 (Commute)
夜勤明けの疲れた朝や、少し雨の降る夕方のバス停など。
1.  **Coordinate A (アイテムの特徴を簡潔に)**
    *   **Top**: （具体的な色・形・素材。例：アイボリーの薄手のリブニット）
    *   **Bottom**: （具体的な色・形・素材。例：グレージュのミモレ丈フレアスカート）
    *   **Outer**: （必要に応じて。アウターなしでも可）
    *   **Bag**: （具体的な色と形）
2.  **Coordinate B (アイテムの特徴を簡潔に)**
    *   **Top**: (...)
    *   **Inner**: (...)
    *   **Bottom**: (...)
    *   **Bag**: (...)

### ☕ 休日のお出かけ (Day Off)
カフェでのんびりする日、買い物に出かける日。
1.  **Coordinate C (アイテムの特徴を簡潔に)**
    *   (...)
2.  **Coordinate D (アイテムの特徴を簡潔に)**
    *   (...)

### 🌙 部屋着・深夜のコンビニ (Roomwear & Night Walk)
自室で夜更かしする時や、アイスを買いに行く時。
1.  **Coordinate E (ジェラピケ風もこもこ等の部屋着の具体例)**
    *   (...)
2.  **Coordinate F (ちょっとそこまで行く用のリラックスウェア)**
    *   (...)

（指示）上記のフォーマットに従い、()内を${targetSeason}の最新トレンドに沿った具体的なアイテム名（シアーシャツ、シャギーニット、マーメイドスカートなど）で埋めて出力してください。
`;

async function updateWardrobe() {
    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-001" });

        console.log("🤖 Generating new wardrobe content...");
        const result = await model.generateContent(generationPrompt);
        const responseText = await result.response.text();
        const finalContent = responseText.trim().replace(/^```markdown\n/, '').replace(/```\n?$/, '');

        // Make sure directory exists if for some reason it doesn't
        fs.mkdirSync(path.dirname(finalPath), { recursive: true });

        // Overwrite the file completely
        fs.writeFileSync(finalPath, finalContent);
        console.log(`✅ Successfully updated Sera's Wardrobe at: ${finalPath}`);

    } catch (e) {
        console.error("❌ Failed to update wardrobe:", e);
        process.exit(1);
    }
}

updateWardrobe();
