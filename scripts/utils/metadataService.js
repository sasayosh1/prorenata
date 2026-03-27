const { Anthropic } = require('@anthropic-ai/sdk');
const { SERA_FULL_PERSONA } = require('./seraPersona');

/**
 * 記事メタデータ・コンテンツ生成サービス
 * すべてのAI生成プロンプトを一元管理し、一貫性を保ちます。
 */
class MetadataService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('MetadataService: ANTHROPIC_API_KEY is required');
    }
    this.anthropic = new Anthropic({ apiKey });
    this.model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest';
  }

  /**
   * 記事のメタデータを生成する（既存コンテンツ用）
   * @param {Object} params 
   * @param {string} params.title 記事タイトル
   * @param {string|Array} params.body 記事本文
   * @param {string} [params.category] 指定カテゴリ
   * @returns {Promise<Object>} { excerpt, metaDescription, tags, category }
   */
  async generateMetadata({ title, body, category }) {
    const plainText = typeof body === 'string' ? body : this._toPlainText(body);
    
    const prompt = `
${SERA_FULL_PERSONA}

# タスク
以下の記事内容に基づき、メタデータを生成してください。

# 記事タイトル
${title}

# 記事本文（抜粋）
${plainText.substring(0, 3000)}

# 生成要件
1. **excerpt (抜粋)**:
   - 100〜150文字程度。
   - 白崎セラ口調（穏やか、寄り添う）。
   - 読者の悩みに共感し、記事を読むメリットを提示。
2. **metaDescription (SEO用説明)**:
   - 120〜160文字（厳守）。完結した文。
   - 重要なキーワード（${title}に関連するもの）を含める。
3. **tags (タグ)**:
   - 具体的なタグを3〜5個。
4. **category (カテゴリ)**:
   - 候補: 仕事, 給与, 資格, 転職, 退職, 心身, 体験
   - 現在の指定: ${category || '未指定'}

# 特別ルール (最重要)
- **タイトルに「、」「。」を絶対に使用しないでください。** 代わりにスペースや語順の調整で対応してください。
- **metaDescriptionは必ず120文字以上、160文字以内**に収めてください。

# 出力形式 (JSONのみ)
{
  "excerpt": "...",
  "metaDescription": "...",
  "tags": ["...", "..."],
  "category": "..."
}
`;
    return this._generateJson(prompt);
  }

  /**
   * 概念からフル記事とメタデータを生成する（自動生成用）
   * @param {Object} params
   */
  async generateFullFromConcept({ keyword, category, titleLengthGuide, titleMinLength, titleMaxLength, toneGuidance }) {
    const prompt = `
${SERA_FULL_PERSONA}
${toneGuidance || ''}

# 【最重要】セラのポジション定義
- セラは**案内役（IP）**であり、情報の責任主体ではない。
- **事実・制度・数値の説明はサイト側（中立的地の文）が担う**。
- **セラは共感・所感・補足のみを担当**し、必ず主観表現（「思います」「感じます」等）を使う。
- YMYL 配慮を最優先し、キャラクター性より安全性を優先する。

# 記事構成の原則
## 導入部
- 【サイト側】制度・背景の客観的説明。
- 【セラ】読者への共感・記事の案内（主観表現必須）。

## 本文
- 【サイト側】見出し・事実・データ・制度説明（断定的・客観的）。
- 【セラ】（必要に応じて）補足・現場感覚・注意点（主観表現必須）。

## まとめ
- 【サイト側】記事の要点整理・安心して読み終えられる整理。
- 【セラ】励まし・伴走的コメント（主観表現必須）。

# 収益化とユーザビリティの統合
- **読者ベネフィット第一**: 単なる解説記事ではなく、「読者が今抱えている具体的な悩み（例: 同僚への言い出しにくさ、面接での詰まり）」を解決する構成にする。
- **キラーページへの誘導**: 内容が「転職」「退職」「給料アップ」に関連する場合、自然な文脈で当サイトの比較記事（退職代行のおすすめ、転職サービスの選び方等）に言及する。
- **実務的トーン**: 理想論だけでなく、現場の「まあ、そうは言っても難しいよね」という感覚に寄り添いつつ、現実的な見通しを整理する。

# 新コンポーネント：セラの助言 (seraAdvice)
- 読者が二者択一で迷いそうな場面や、重要な決断を後押しする場面で、**1つの記事につき最大1回まで**使用可能。
- **形式**: '{"_type": "seraAdvice", "content": "ここに断定的で具体的なアドバイス"}'
- 内容は「わたしは〜を選びます。なぜなら〜だからです」という、主観と責任を持った明快な表現にする。
- 文脈上、不要と判断した場合は無理に使用しない（自然な流れを最優先）。

# 記事要件
- テーマ: 「${keyword}」（看護助手向け）
- カテゴリ: ${category}
- 構成: 導入 → H2見出し3〜4個 → まとめ
- **重要**: まとめでは「次回〜」「お楽しみに」など次回への言及は不要。
- タイトル文字数: ${titleLengthGuide} (最低${titleMinLength}文字、最大${titleMaxLength}文字)
- **タイトルに「【】」などの括弧装飾は使わない。**
- **タイトルに「、」「。」を絶対に使用しない（スペースや語順で調整）。**
- **タイトル末尾を「…」「...」で終えない。**
- 挨拶や自己紹介（「白崎セラです」等）は入れず、本題から開始する。

# 出力形式 (JSONのみ、コードブロックなし)
{
  "title": "${titleLengthGuide}で読者メリットが伝わるタイトル",
  "slug_keywords": "英語の重要キーワード3-4個（例: nursing-assistant-salary-tips）",
  "excerpt": "記事の要約（100〜150文字）。読者の悩みに寄り添い、解決策を提示する文章（白崎セラ口調）。",
  "metaDescription": "SEO用説明文（120〜160文字）。検索結果でクリックしたくなる魅力的な紹介文。",
  "tags": ["${category}", "看護助手"],
  "body": [
    {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "(導入文)"}]},
    {"_type": "block", "style": "h2", "children": [{"_type": "span", "text": "(H2見出し1)"}]},
    {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "(本文)"}]},
    {"_type": "seraAdvice", "content": "(セラのアドバイス。必要な場合のみ。)"},
    {"_type": "block", "style": "h2", "children": [{"_type": "span", "text": "まとめ"}]},
    {"_type": "block", "style": "normal", "children": [{"_type": "span", "text": "(まとめ本文。挨拶不要。)"}]}
  ]
}
`;
    return this._generateJson(prompt);
  }

  /**
   * 季節やトレンドに関連するトピックを生成する
   * @returns {Promise<string[]>} キーワードの配列
   */
  async brainstormTrends() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const prompt = `看護助手の現場において、現在（${year}年${month}月）の季節感、最近の業界ニュース、実務上の悩み、またはトレンドに関するキーワードやトピックを10個、カンマ区切りで挙げてください。例: 春の入職準備, 花粉症対策, 腰痛予防, 法改正の進捗 など。余計な説明は省き、キーワードのみを出力してください。`;
    
    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }]
      });
      const text = response.content[0].text.trim();
      return text.split(/[,、|]/).map(k => k.trim()).filter(k => k.length > 1);
    } catch (error) {
      console.error('MetadataService Brainstorm Error:', error);
      return [];
    }
  }

  /**
   * Geminiを呼び出してJSONをパースする
   * @private
   */
  async _generateJson(prompt) {
    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      });
      let text = response.content[0].text;

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
    } catch (error) {
      console.error('MetadataService Generation Error:', error);
      throw error;
    }
  }

  /**
   * Portable Textをプレーンテキストに変換
   * @private
   */
  _toPlainText(blocks = []) {
    if (!Array.isArray(blocks)) return '';
    return blocks
      .map(block => {
        if (block._type !== 'block' || !block.children) return '';
        return block.children.map(child => child.text || '').join('');
      })
      .join('\n\n');
  }
}

module.exports = MetadataService;
