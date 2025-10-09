#!/bin/bash

# リンク検証スクリプトの定期実行用シェルスクリプト
# cron で定期実行することを想定

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/link-validation-$(date +%Y%m%d-%H%M%S).log"

# ログディレクトリ作成
mkdir -p "$LOG_DIR"

# ログファイルに出力
echo "========================================" | tee -a "$LOG_FILE"
echo "リンク検証開始: $(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Node.jsスクリプト実行
cd "$PROJECT_DIR"
node "$SCRIPT_DIR/validate-links.js" 2>&1 | tee -a "$LOG_FILE"

EXIT_CODE=${PIPESTATUS[0]}

echo "" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "リンク検証終了: $(date)" | tee -a "$LOG_FILE"
echo "終了コード: $EXIT_CODE" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# エラーがあった場合はメール通知（オプション）
if [ $EXIT_CODE -ne 0 ]; then
  echo "⚠️  エラーが検出されました。ログを確認してください: $LOG_FILE" | tee -a "$LOG_FILE"

  # Slackやメール通知を追加する場合はここに実装
  # 例: curl -X POST -H 'Content-type: application/json' --data '{"text":"リンクエラー検出"}' YOUR_SLACK_WEBHOOK_URL
fi

# 古いログファイル削除（30日以上前のもの）
find "$LOG_DIR" -name "link-validation-*.log" -mtime +30 -delete

exit $EXIT_CODE
