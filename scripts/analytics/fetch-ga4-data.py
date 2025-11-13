#!/usr/bin/env python3
"""
GA4 データ取得スクリプト

過去30日間のGA4データを取得し、CSVに保存します。
- セッション数
- ユーザー数
- イベント数
- ページパス別

環境変数:
- GOOGLE_APPLICATION_CREDENTIALS: サービスアカウントJSONファイルのパス
- GA4_PROPERTY_ID: GA4のプロパティID（デフォルト: 504242963）
"""

import os
import sys
from datetime import date, timedelta
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    RunReportRequest,
    DateRange,
    Dimension,
    Metric,
)
import pandas as pd

def main():
    # 設定
    PROPERTY_ID = os.environ.get("GA4_PROPERTY_ID", "504242963")
    OUTPUT_FILE = "data/ga4_last30d.csv"

    # 認証情報の確認
    if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        print("Error: GOOGLE_APPLICATION_CREDENTIALS 環境変数が設定されていません")
        sys.exit(1)

    print(f"📊 GA4 データ取得開始")
    print(f"   プロパティID: {PROPERTY_ID}")

    try:
        # GA4 Data API クライアント作成
        client = BetaAnalyticsDataClient()

        # 期間設定（過去30日間）
        end_date = date.today()
        start_date = end_date - timedelta(days=30)

        print(f"   期間: {start_date} 〜 {end_date}")

        # レポートリクエスト
        request = RunReportRequest(
            property=f"properties/{PROPERTY_ID}",
            dimensions=[
                Dimension(name="date"),
                Dimension(name="pagePath"),
                Dimension(name="deviceCategory"),
                Dimension(name="country"),
            ],
            metrics=[
                Metric(name="sessions"),
                Metric(name="totalUsers"),
                Metric(name="eventCount"),
                Metric(name="engagementRate"),
                Metric(name="averageSessionDuration"),
            ],
            date_ranges=[
                DateRange(
                    start_date=start_date.isoformat(),
                    end_date=end_date.isoformat()
                )
            ],
            limit=25000,
        )

        # API実行
        response = client.run_report(request)

        # データ整形
        data = []
        for row in response.rows:
            data.append({
                "date": row.dimension_values[0].value,
                "pagePath": row.dimension_values[1].value,
                "deviceCategory": row.dimension_values[2].value,
                "country": row.dimension_values[3].value,
                "sessions": int(row.metric_values[0].value or 0),
                "totalUsers": int(row.metric_values[1].value or 0),
                "eventCount": int(row.metric_values[2].value or 0),
                "engagementRate": float(row.metric_values[3].value or 0),
                "averageSessionDuration": float(row.metric_values[4].value or 0),
            })

        # CSV保存
        df = pd.DataFrame(data)
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        df.to_csv(OUTPUT_FILE, index=False, encoding="utf-8")

        print(f"✅ 保存完了: {OUTPUT_FILE}")
        print(f"   データ行数: {len(df):,}")
        print(f"   総セッション数: {df['sessions'].sum():,}")
        print(f"   総ユーザー数: {df['totalUsers'].sum():,}")
        print(f"   総イベント数: {df['eventCount'].sum():,}")
        print(f"   平均エンゲージメント率: {df['engagementRate'].mean():.2%}")

    except Exception as e:
        print(f"❌ エラー: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
