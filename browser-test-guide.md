# ブラウザテスト手順（Gemini CLI推奨）

## 🔍 bodyフィールド表示問題の最終確認

### Step 1: Vision Tool確認
**URL**: http://localhost:3333/vision
**クエリ実行**:
```groq
*[_id == "Jx7ptA0c3Aq7il8T99GtdA"]{body}
```
**期待結果**: 30要素のbody配列が表示される

### Step 2: ブラウザ拡張機能テスト
**現在のURL**: http://localhost:3333/structure/post;Jx7ptA0c3Aq7il8T99GtdA

#### A. 拡張機能無効化テスト
1. Chrome設定 → 拡張機能 → すべて無効
2. ページリロード (Cmd+Shift+R)
3. bodyフィールド確認

#### B. プライベートモードテスト
1. Chrome新規プライベートウィンドウ
2. http://localhost:3333/structure/post;Jx7ptA0c3Aq7il8T99GtdA
3. bodyフィールド確認

#### C. 別ブラウザテスト
**Safari**:
1. http://localhost:3333/structure/post;Jx7ptA0c3Aq7il8T99GtdA
2. bodyフィールド確認

**Firefox**:
1. http://localhost:3333/structure/post;Jx7ptA0c3Aq7il8T99GtdA  
2. bodyフィールド確認

### Step 3: 開発者ツール確認
1. F12 または Cmd+Option+I
2. Console タブでエラー確認
3. Network タブで通信エラー確認

### 期待される表示内容
- 30要素のPortable Text
- H2見出し「【完全ガイド】看護助手とは？」
- 段落、リスト、太字テキスト
- リッチテキストエディタツールバー