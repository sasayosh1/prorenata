# Chat Logs (Chappy)

ChatGPT（チャッピー）との議論ログを、リポジトリ内に Markdown として保存するための運用ルールです。

## 保存先

- `docs/chatlogs/`

## 命名規則

- `YYYY-MM-DD_prorenata-<topic>.md`
  - 例: `2025-12-16_prorenata-vibecoding-ops.md`

`<topic>` はスクリプトが安全なファイル名に正規化します（スペース→`-`、英数字/`-`/`_` のみ）。

## 追記ルール（推奨）

ログは「追記型」で使います。

- まず作成: `chatlog:save` を実行
- 以後追記: 同じ `<topic>` で再度 `chatlog:save` を実行

## 保存手順（Mac）

1) ChatGPT の該当範囲をコピー（クリップボードへ）
2) 以下を実行

```bash
npm run chatlog:save -- "vibecoding-ops"
```

または:

```bash
./scripts/save-chatlog.sh "vibecoding-ops"
```

実行権限がない場合は一度だけ:

```bash
chmod +x scripts/save-chatlog.sh
```

## テンプレ構成

- frontmatter（`date`, `repo`, `topic`, `tags`）
- 目次
- 要点 / 決定事項 / 次アクション
- Transcript（クリップボード内容）

## index

- `docs/chatlogs/index.md` は `save-chatlog.sh` 実行時に自動生成/更新されます。
