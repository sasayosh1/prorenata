#!/bin/bash

# Sanity API Token 有効性チェック
# 週次メンテナンスの最初に実行され、トークンの状態を確認

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# .env.localから環境変数を読み込み
if [ -f "$PROJECT_DIR/.env.local" ]; then
  source "$PROJECT_DIR/.env.local"
fi

echo "🔑 Sanity API Token 有効性チェック"
echo "----------------------------------------"

# トークンが設定されているか確認
if [ -z "$SANITY_API_TOKEN" ]; then
  echo "❌ SANITY_API_TOKENが設定されていません"
  echo "   .env.localファイルを確認してください"
  exit 1
fi

# トークンをテスト（簡単なクエリを実行）
HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null \
  -H "Authorization: Bearer $SANITY_API_TOKEN" \
  "https://72m8vhy2.api.sanity.io/v2024-01-01/data/query/production?query=*%5B_type+%3D%3D+%22post%22%5D%5B0%5D%7B_id%7D")

if [ "$HTTP_CODE" == "401" ]; then
  echo "❌ トークンが無効または期限切れです！"
  echo ""
  echo "【対処方法】"
  echo "1. https://www.sanity.io/manage にアクセス"
  echo "2. プロジェクト「ProReNata」を選択"
  echo "3. API → Tokens → Add API token"
  echo "4. 名前: ProReNata Admin / 権限: Editor / 有効期限: 90日"
  echo "5. 生成されたトークンを .env.local に設定"
  echo "   SANITY_API_TOKEN=新しいトークン"
  echo ""
  exit 1
elif [ "$HTTP_CODE" == "200" ]; then
  echo "✅ トークンは有効です"

  # トークン発行日を記録（初回のみ）
  TOKEN_ISSUE_FILE="$PROJECT_DIR/.sanity-token-issued"

  if [ ! -f "$TOKEN_ISSUE_FILE" ]; then
    echo "$(date +%Y-%m-%d)" > "$TOKEN_ISSUE_FILE"
    echo "   トークン発行日を記録しました: $(date +%Y-%m-%d)"
  else
    ISSUE_DATE=$(cat "$TOKEN_ISSUE_FILE")
    CURRENT_DATE=$(date +%Y-%m-%d)

    # 日数計算（macOS/Linux互換）
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS
      ISSUE_TIMESTAMP=$(date -j -f "%Y-%m-%d" "$ISSUE_DATE" +%s)
      CURRENT_TIMESTAMP=$(date -j -f "%Y-%m-%d" "$CURRENT_DATE" +%s)
    else
      # Linux
      ISSUE_TIMESTAMP=$(date -d "$ISSUE_DATE" +%s)
      CURRENT_TIMESTAMP=$(date -d "$CURRENT_DATE" +%s)
    fi

    DAYS_ELAPSED=$(( ($CURRENT_TIMESTAMP - $ISSUE_TIMESTAMP) / 86400 ))
    DAYS_REMAINING=$(( 90 - $DAYS_ELAPSED ))

    echo "   発行日: $ISSUE_DATE"
    echo "   経過日数: ${DAYS_ELAPSED}日"
    echo "   残り有効期間: ${DAYS_REMAINING}日"

    # 警告表示
    if [ $DAYS_REMAINING -le 0 ]; then
      echo ""
      echo "⚠️  トークンが期限切れの可能性があります！"
      echo "   新しいトークンを発行してください"
      echo ""
      exit 1
    elif [ $DAYS_REMAINING -le 7 ]; then
      echo ""
      echo "🚨 【緊急】トークンの有効期限まであと${DAYS_REMAINING}日です！"
      echo "   今すぐ新しいトークンを発行してください"
      echo ""
    elif [ $DAYS_REMAINING -le 14 ]; then
      echo ""
      echo "⚠️  【警告】トークンの有効期限まであと${DAYS_REMAINING}日です"
      echo "   早めに新しいトークンを発行することをお勧めします"
      echo ""
    elif [ $DAYS_REMAINING -le 30 ]; then
      echo ""
      echo "ℹ️  【通知】トークンの有効期限まであと${DAYS_REMAINING}日です"
      echo ""
    fi
  fi

  exit 0
else
  echo "⚠️  予期しないHTTPステータスコード: $HTTP_CODE"
  echo "   Sanity APIに問題がある可能性があります"
  exit 1
fi
