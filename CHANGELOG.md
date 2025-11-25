# ProReNata 変更履歴

このファイルは、CLAUDE.mdの「最近の変更」セクションから移動された、古い変更履歴を保存しています。

---

## 2025-10-25以前の変更

### 5. 💰 **記事生成頻度の最適化とコスト削減** (2025-10-25)
- 記事自動生成を毎日実行から週3回（水・土・日）に変更
- Gemini API使用料を60%削減（¥147/月 → ¥59/月）
- 全費用の100%がGemini APIによるものと判明
- 夜間スクリプト群の包括的改善を実施：
  - Gemini APIモデルをgemini-2.5-flashに統一（⚠️ 後に存在しないモデルと判明、Proにフォールバックしていた）
  - 記事生成失敗時のGitHub Issue自動作成機能追加
  - X投稿の重複回避機構実装（30日履歴管理）
  - excerpt自動更新機能追加（白崎セラ口調で一貫性保持）

### 4. 🚨 **プレビューボタン重大インシデント対応完了** (2025-09-27)
- Sanity Studio プレビューボタン機能が完全消失（重大インシデント）
- 緊急復旧: `src/sanity/actions/PreviewAction.tsx` を再作成
- `sanity.config.ts` の PreviewAction 設定を再構築
- 今後の予防策をCLAUDE.mdに追記（削除・変更の完全禁止）

### 3. ✅ **Google Search Console設定完了** (2025-09-15)
- DNS TXT方式で所有権確認成功
- 確認コード: google-site-verification=Xy7fDHrYsVObXVQeb0D3He2wEWQCSnlsClAJ_OYsioE
- プロパティ: https://prorenata.jp

### 2. 🔒 **UI変更永久禁止** (2025-09-12)
- UI-DESIGN-LOCK.mdファイル追加
- 今後はフロントエンドデザインの変更を完全禁止
- 機能追加・コンテンツ改善のみ許可

### 2. 🎨 **フロントエンドデザイン完成** (2025-09-12)
- Tailwind Next.js Starter Blogデザインの完全再現
- 薄いグレー文字問題を根本解決
- カスタムCSSを削除、Tailwind標準クラスのみ使用
