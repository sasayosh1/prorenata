# 開発サーバ自動化メモ

このファイルは、開発時に出てくる「許可（allow）」や対話プロンプトを自動化／回避するための手順をまとめたものです。

## 1) 非対話的に Next 開発サーバを起動

package.json に以下のスクリプトを追加しました。

- `npm run dev:auto`
  - CI 環境フラグとテレメトリ無効化をセットして非対話で起動します。
  - 実際のコマンド: `CI=true NEXT_TELEMETRY_DISABLED=1 PORT=3000 next dev -p 3000`

- `npm run dev:background`
  - ポート 3000 を占有しているプロセスを取り除き、バックグラウンドで起動してログを `.dev.log` に書き出します。
  - 実際のコマンド: `sh -c 'kill -9 $(lsof -ti TCP:3000) 2>/dev/null || true; nohup npm run dev:auto > .dev.log 2>&1 & echo $! > .dev.pid'`

使い分け:
- ログを見ながら手動で起動するなら `npm run dev:auto`。
- デーモンのように起動したい場合は `npm run dev:background`。

## 2) macOS の「Allow incoming connections」ダイアログを自動化（注意: 管理者権限が必要）

macOS のファイアウォールが `node` に対して「Allow」を求める場合は、システム側で node バイナリを許可リストに追加できます（管理者権限が必要）。

例（sudo が必要）:

```bash
# アプリケーションファイアウォールに node を追加
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add "$(command -v node)"
# node を許可（unblock）する
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp "$(command -v node)"
```

注意:
- この操作はセキュリティ上の影響があります。組織のポリシーやセキュリティルールに従って適用してください。

もし手動でコマンドを毎回打ちたくない場合は、リポジトリに補助スクリプト `scripts/allow-node-firewall.sh` を追加しました。実行方法の例:

```bash
# スクリプトに実行権限を付与して sudo で実行する
chmod +x scripts/allow-node-firewall.sh
sudo scripts/allow-node-firewall.sh
```

## 3) CLI の対話を避けるための一般的な指針

- 多くの CLI は `--yes`, `--no-interactive`, `CI=true` のような環境変数やフラグで対話をスキップできます。
- もし他のツール（Sanity など）で毎回許可が必要なケースがあれば、使えるフラグを調べて追加します。

---
更新: 自動起動用 npm スクリプトを追加済み。
