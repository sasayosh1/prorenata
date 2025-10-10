#!/bin/bash

# ProReNata 週次メンテナンススクリプト
# 毎週月曜日午前2時に自動実行
# リンク検証 → 問題があれば自動修正

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/weekly-maintenance-$(date +%Y%m%d-%H%M%S).log"

# ログディレクトリ作成
mkdir -p "$LOG_DIR"

# SANITY_API_TOKENを環境変数に設定
export SANITY_API_TOKEN="skr1c2L1RXIurqHGPDuuPxOVYHHBzGnMv19JunO27lvm4vDgMGN4Pwm6XcLvzv8p335TAZlIX6WRVd7qzyr3jr75jUMKGjqXW6mZrvKpnG11omYeoknesfT9P70s92m2vINM0tpJzSBONCW9jvXLLFepyLqz5ZsCivb3uJjgaYmmP3XK7odY"

# ログ開始
{
  echo "========================================"
  echo "ProReNata 週次メンテナンス"
  echo "開始: $(date)"
  echo "========================================"
  echo ""

  # ステップ1: リンク検証
  echo "📍 ステップ1: リンク検証"
  echo "----------------------------------------"
  cd "$PROJECT_DIR"
  node "$SCRIPT_DIR/validate-links.js" 2>&1
  VALIDATION_EXIT_CODE=$?
  echo ""

  # ステップ2: 問題があれば自動修正
  if [ $VALIDATION_EXIT_CODE -ne 0 ]; then
    echo "⚠️  リンク問題を検出しました。自動修正を開始します..."
    echo ""

    echo "📍 ステップ2: 全リンク問題修正"
    echo "----------------------------------------"
    node "$SCRIPT_DIR/fix-all-link-issues.js" 2>&1
    echo ""

    echo "📍 ステップ3: アフィリエイトリンクテキスト修正"
    echo "----------------------------------------"
    node "$SCRIPT_DIR/fix-affiliate-link-text.js" 2>&1
    echo ""

    echo "📍 ステップ4: 壊れた内部リンク削除"
    echo "----------------------------------------"
    node "$SCRIPT_DIR/remove-broken-internal-links.js" 2>&1
    echo ""

    echo "📍 ステップ5: 最終検証"
    echo "----------------------------------------"
    node "$SCRIPT_DIR/validate-links.js" 2>&1
    FINAL_EXIT_CODE=$?
    echo ""

    if [ $FINAL_EXIT_CODE -eq 0 ]; then
      echo "✅ すべての問題を自動修正しました"
    else
      echo "⚠️  一部の問題が残っています。手動確認が必要です。"
    fi
  else
    echo "✅ リンク検証でエラーなし。修正は不要です。"
  fi

  echo ""
  echo "========================================"
  echo "週次メンテナンス完了: $(date)"
  echo "========================================"

} 2>&1 | tee "$LOG_FILE"

# 古いログファイル削除（30日以上前のもの）
find "$LOG_DIR" -name "weekly-maintenance-*.log" -mtime +30 -delete

# 終了コードを返す
if [ $VALIDATION_EXIT_CODE -eq 0 ]; then
  exit 0
else
  exit 1
fi
