const fs = require('fs');
const path = require('path');
const { Anthropic } = require('@anthropic-ai/sdk');

// --- Configuration ---
const AUTH_KEY = (process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY)?.trim();
if (!AUTH_KEY) {
    console.error("FATAL: ANTHROPIC_API_KEY is not set.");
    process.exit(1);
}

const LIFESTYLE_FILE_PATH = path.join(
    process.cwd(),
    'Library', 'Mobile Documents', 'iCloud~md~obsidian', 'Documents', 'sasayoshi',
    '00_System', 'UserProfile', '08_セラの季節感(Sera_Lifestyle).md'
);

// Fallback path if run from inside the prorenata project dir directly vs home dir
const ALT_LIFESTYLE_PATH = path.join(process.env.HOME || '/Users/sasakiyoshimasa', 'Library/Mobile Documents/iCloud~md~obsidian/Documents/sasayoshi/00_System/UserProfile/08_セラの季節感(Sera_Lifestyle).md');
const finalPath = fs.existsSync(ALT_LIFESTYLE_PATH) ? ALT_LIFESTYLE_PATH : LIFESTYLE_FILE_PATH;


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
あなたは20代女性向けのファッショントレンド・ライフスタイルに精通したスタイリスト兼プランナーです。
白崎セラ（20歳・女性・看護助手）の「衣・食・住」の季節感設定の「${targetSeason}」の最新データを生成してください。

【セラのライフスタイルルール（絶対厳守）】
1. 配色: 服装や小物は「淡色系（アイボリー、グレージュ、ペールブルー、ミントグリーンなど）」限定。原色や派手な柄はNG。
2. ブランドイメージ: VIS、ROPE' PICNIC、SNIDEL、gelato piqueなどのリアルな20代女性の清楚・リラックスカジュアル。
3. 食と住: 季節に合わせた「冷たい/温かい」飲み物の指定、コンビニやスーパーで買える季節のスイーツ、家の冷房/暖房機器などを具体的に指定し、Amazonや楽天で自然に商品を紹介できる解像度にしてください。

【出力フォーマット（厳守）】
以下のMarkdown構造と見出し（#や##のレベル）を完全に守って出力してください。余計な挨拶や前置きは不要です。Markdownテキストのみを出力してください。

# セラの季節感・ライフスタイル (Sera's Lifestyle Database)

このファイルは、白崎セラ（20代女性・看護助手）の具体的な衣・食・住の季節感設定を定義する辞書です。
AIはこのファイルから季節・文脈に合った「服装・飲み物・食べ物・インテリア」を抽出し、情景描写として組み込みます。

## 🎨 基本ルール (Style Rules)
*   **配色**: 服や小物は淡色系（アイボリー、グレージュなど）。
*   **テイスト**: 清潔感、リラックス、適度なトレンド感。
*   **ライフスタイル**: 豪華なディナーよりも「仕事終わりのコンビニスイーツ」や「休日のカフェの季節限定ドリンク」、「Amazonで買った便利な季節家電」に幸せを感じる等身大の20代。

---

## 🌻 今季のライフスタイル (${targetSeason})

### 💼 通勤・退勤 (Commute)
夜勤明けの疲れた朝や、少し雨の降る夕方のバス停など。
1.  **Coordinate A (アイテムの特徴を簡潔に)**
    *   **服**: （具体的な色・形・素材。例：アイボリーのリブニットとベージュのトレンチ）
    *   **小物**: （バッグや傘など）
    *   **飲み物**: （例：コンビニのホットコーヒー、または冷たいジャスミンティー）
    *   **食べ物**: （例：帰り道に買った肉まん、または涼しげなゼリー飲料）
2.  **Coordinate B (アイテムの特徴を簡潔に)**
    *   **服**: (...)
    *   **小物**: (...)
    *   **飲み物**: (...)
    *   **食べ物**: (...)

### ☕ 休日のお出かけ (Day Off)
カフェでのんびりする日、買い物に出かける日。
1.  **Coordinate C (アイテムの特徴を簡潔に)**
    *   **服**: （例：ミントグリーンの小花柄ワンピース）
    *   **小物**: （例：サマンサタバサ風のピンクのミニバッグ）
    *   **飲み物**: （例：カフェの季節限定フラペチーノ、または温かいチャイラテ）
    *   **食べ物**: （例：季節のフルーツタルト）
2.  **Coordinate D (アイテムの特徴を簡潔に)**
    *   (...)

### 🌙 部屋着・深夜の自室 (Roomwear & Night Relax)
自室で夜更かしする時や、スマホをいじりながらくつろぐ時。
1.  **Coordinate E (ジェラピケ風もこもこ等の部屋着の具体例)**
    *   **服**: （具体的な部屋着。例：ジェラピケ風の淡いピンクのもこもこパーカー）
    *   **部屋の環境**: （例：足元には小さな電気ヒーター、または冷房を効かせた涼しい部屋）
    *   **飲み物**: （例：マグカップで飲む温かいハーブティー、または氷を入れた麦茶）
    *   **食べ物**: （例：スーパーで買ったファミリーサイズのアイスクリーム、または温かいスープ）
2.  **Coordinate F (ちょっとそこまでのリラックスウェア)**
    *   **服**: (...)
    *   **部屋の環境**: (...)
    *   **飲み物**: (...)
    *   **食べ物**: (...)

（指示）上記のフォーマットに従い、()内を${targetSeason}の最新トレンドに沿った具体的なアイテム名（シアーシャツ、シャギーニット、季節のフラペチーノ、こたつ、冷風扇など）で埋めて出力してください。
`;

async function updateLifestyle() {
    try {
        const anthropic = new Anthropic({ apiKey: AUTH_KEY });
        const modelName = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";

        console.log("🤖 Generating new lifestyle content (clothes, food, drinks, living)...");
        const response = await anthropic.messages.create({
            model: modelName,
            max_tokens: 4000,
            messages: [{ role: 'user', content: generationPrompt }]
        });
        const responseText = response.content[0].text;
        const finalContent = responseText.trim().replace(/^```markdown\n/, '').replace(/```\n?$/, '');

        // Make sure directory exists if for some reason it doesn't
        fs.mkdirSync(path.dirname(finalPath), { recursive: true });

        // Overwrite the file completely
        fs.writeFileSync(finalPath, finalContent);
        console.log(`✅ Successfully updated Sera's Lifestyle Database at: ${finalPath}`);

    } catch (e) {
        console.error("❌ Failed to update lifestyle database:", e);
        process.exit(1);
    }
}

updateLifestyle();
