#!/bin/bash

# アフィリエイトリンク健全性チェックの定期実行設定
# 毎週月曜日の午前9時に実行

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "============================================================"
echo "🔧 アフィリエイトリンク健全性チェック定期実行設定"
echo "============================================================"
echo ""

# crontabエントリを作成
CRON_ENTRY="0 9 * * 1 cd $PROJECT_DIR && /usr/bin/env node scripts/check-affiliate-links-health.js >> logs/link-health-check.log 2>&1"

echo "📋 設定する crontab エントリ:"
echo "$CRON_ENTRY"
echo ""

# ログディレクトリを作成
if [ ! -d "$PROJECT_DIR/logs" ]; then
    mkdir -p "$PROJECT_DIR/logs"
    echo "✅ ログディレクトリを作成しました: $PROJECT_DIR/logs"
fi

# 既存のcrontabを確認
if crontab -l 2>/dev/null | grep -q "check-affiliate-links-health.js"; then
    echo "⚠️  既に crontab に登録されています"
    echo ""
    echo "現在の設定:"
    crontab -l | grep "check-affiliate-links-health.js"
else
    echo "📝 crontab に追加しますか？ (y/n)"
    read -r response
    
    if [ "$response" = "y" ]; then
        # 既存のcrontabに追加
        (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
        echo "✅ crontab に追加しました"
        echo ""
        echo "🕐 実行スケジュール: 毎週月曜日 午前9時"
        echo "📁 ログファイル: $PROJECT_DIR/logs/link-health-check.log"
    else
        echo "❌ キャンセルしました"
    fi
fi

echo ""
echo "============================================================"
echo "💡 手動実行方法:"
echo "  cd $PROJECT_DIR"
echo "  node scripts/check-affiliate-links-health.js"
echo ""
echo "📝 crontab 確認:"
echo "  crontab -l"
echo ""
echo "🗑️  crontab 削除:"
echo "  crontab -l | grep -v 'check-affiliate-links-health.js' | crontab -"
echo "============================================================"
echo ""
