#!/usr/bin/env python3
"""
Search Console データ取得スクリプト

過去30日間の検索パフォーマンスデータを取得し、CSVに保存します。
- クリック数
- 表示回数
- CTR
- 平均掲載順位
- 検索クエリ、ページURL、国、デバイス別

環境変数:
- GOOGLE_APPLICATION_CREDENTIALS: サービスアカウントJSONファイルのパス
- GSC_SITE_URL: Search ConsoleのプロパティURL（デフォルト: https://prorenata.jp/）
"""

import os
import sys
from datetime import date, timedelta
from googleapiclient.discovery import build
import pandas as pd

def main():
    # 設定
    SITE_URL = os.environ.get("GSC_SITE_URL", "https://prorenata.jp/")
    OUTPUT_FILE = "data/gsc_last30d.csv"

    # 認証情報の確認
    # 認証情報の確認
    if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        print("Warning: GOOGLE_APPLICATION_CREDENTIALS 環境変数が設定されていません。スキップします。")
        # エラーではなく正常終了として扱い、後続のプロセスでデータがないことを検知させる
        sys.exit(0)

    print(f"🔍 Search Console データ取得開始")
    print(f"   プロパティ: {SITE_URL}")

    try:
        # Search Console API クライアント作成
        service = build("searchconsole", "v1")

        # 期間設定（過去30日間）
        end_date = date.today()
        start_date = end_date - timedelta(days=30)

        print(f"   期間: {start_date} 〜 {end_date}")

        # クエリリクエスト
        request_body = {
            "startDate": start_date.isoformat(),
            "endDate": end_date.isoformat(),
            "dimensions": ["date", "page", "query", "country", "device"],
            "rowLimit": 25000,
            "dataState": "final"  # 確定データのみ
        }

        # API実行
        response = service.searchanalytics().query(
            siteUrl=SITE_URL,
            body=request_body
        ).execute()

        # データ整形
        rows = response.get("rows", [])
        data = []

        for row in rows:
            keys = row.get("keys", [])
            data.append({
                "date": keys[0] if len(keys) > 0 else "",
                "page": keys[1] if len(keys) > 1 else "",
                "query": keys[2] if len(keys) > 2 else "",
                "country": keys[3] if len(keys) > 3 else "",
                "device": keys[4] if len(keys) > 4 else "",
                "clicks": row.get("clicks", 0),
                "impressions": row.get("impressions", 0),
                "ctr": row.get("ctr", 0.0),
                "position": row.get("position", 0.0),
            })

        # CSV保存
        df = pd.DataFrame(data)
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        df.to_csv(OUTPUT_FILE, index=False, encoding="utf-8")

        print(f"✅ 保存完了: {OUTPUT_FILE}")
        print(f"   データ行数: {len(df):,}")
        print(f"   総クリック数: {df['clicks'].sum():,}")
        print(f"   総表示回数: {df['impressions'].sum():,}")
        print(f"   平均CTR: {df['ctr'].mean():.2%}")
        print(f"   平均掲載順位: {df['position'].mean():.1f}")

    except Exception as e:
        print(f"❌ エラー: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
