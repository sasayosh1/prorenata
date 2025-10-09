#!/bin/bash

# ProReNata 自動収益化スクリプト
# ユーザー価値 × アフィリエイト収益の自動追加

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/auto-monetize-$(date +%Y%m%d-%H%M%S).log"

# ログディレクトリ作成
mkdir -p "$LOG_DIR"

echo "========================================" | tee -a "$LOG_FILE"
echo "🎁 ProReNata 自動収益化開始: $(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

cd "$PROJECT_DIR"

# 1. 実用的なアイテムリスト追加
echo "📦 実用的なアイテムリストを追加中..." | tee -a "$LOG_FILE"
echo "----------------------------------------" | tee -a "$LOG_FILE"
node "$SCRIPT_DIR/add-helpful-items.js" --execute 2>&1 | tee -a "$LOG_FILE"
ITEMS_EXIT_CODE=$?
echo "アイテム追加終了コード: $ITEMS_EXIT_CODE" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# 2. 転職サービス推奨セクション追加
echo "💼 転職サービス推奨セクションを追加中..." | tee -a "$LOG_FILE"
echo "----------------------------------------" | tee -a "$LOG_FILE"
node "$SCRIPT_DIR/add-job-service.js" --execute 2>&1 | tee -a "$LOG_FILE"
JOB_EXIT_CODE=$?
echo "転職セクション追加終了コード: $JOB_EXIT_CODE" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# 3. 結果サマリー
echo "========================================" | tee -a "$LOG_FILE"
echo "🎁 自動収益化完了: $(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "📊 実行結果:" | tee -a "$LOG_FILE"
echo "  アイテムリスト追加: $([ $ITEMS_EXIT_CODE -eq 0 ] && echo '✅ 成功' || echo '⚠️ エラー')" | tee -a "$LOG_FILE"
echo "  転職サービス追加: $([ $JOB_EXIT_CODE -eq 0 ] && echo '✅ 成功' || echo '⚠️ エラー')" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# エラーがあった場合は警告
if [ $ITEMS_EXIT_CODE -ne 0 ] || [ $JOB_EXIT_CODE -ne 0 ]; then
  echo "⚠️  エラーが検出されました。ログを確認してください: $LOG_FILE" | tee -a "$LOG_FILE"
fi

# 古いログファイル削除（30日以上前のもの）
find "$LOG_DIR" -name "auto-monetize-*.log" -mtime +30 -delete

# いずれかのタスクが失敗した場合は終了コード1
[ $ITEMS_EXIT_CODE -eq 0 ] && [ $JOB_EXIT_CODE -eq 0 ]
exit $?
