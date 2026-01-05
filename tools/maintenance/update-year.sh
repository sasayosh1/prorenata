#!/bin/bash

# スクリプトの目的: 記事のタイトルと本文に含まれる年を更新する
# 使い方: ./update-year.sh <古い年> <新しい年>
# 例: ./update-year.sh 2025 2026

# --- 引数のチェック ---
if [ "$#" -ne 2 ]; then
    echo "エラー: 引数が正しくありません。"
    echo "使い方: $0 <古い年> <新しい年>"
    echo "例: $0 2025 2026"
    exit 1
fi

OLD_YEAR=$1
NEW_YEAR=$2

# --- 環境変数のチェック ---
if [ -z "$SANITY_API_TOKEN" ]; then
    echo "エラー: 環境変数 SANITY_API_TOKEN が設定されていません。"
    echo "実行前に 'export SANITY_API_TOKEN=あなたのトークン' を実行してください。"
    exit 1
fi

# --- Node.jsヘルパースクリプトの存在チェック ---
HELPER_SCRIPT="$(dirname "$0")/replace-helper.js"
if [ ! -f "$HELPER_SCRIPT" ]; then
    echo "エラー: ヘルパースクリプト ($HELPER_SCRIPT) が見つかりません。"
    exit 1
fi

# --- 確認メッセージ ---
echo "記事に含まれる「${OLD_YEAR}年」を「${NEW_YEAR}年」に更新します。"
read -p "よろしいですか？ (y/N): " -n 1 -r
echo # 改行
if [[ ! $REPLY =~ ^[Yy]$ ]]
_YEARthen
    echo "処理を中断しました。"
    exit 0
fi

# --- 置換処理の実行 ---
# Node.jsスクリプトに "年" を付けた文字列を渡す
node "$HELPER_SCRIPT" "${OLD_YEAR}年" "${NEW_YEAR}年"

echo "処理が完了しました。"
