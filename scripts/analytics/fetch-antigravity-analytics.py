#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Antigravity 用 GA4 / Search Console アナリティクス取得スクリプト

使用する環境変数:
  - ANTIGRAVITY_GA4_PROPERTY_ID
  - ANTIGRAVITY_GSC_SITE_URL
  - ANTIGRAVITY_GA_GSC_KEY_FILE
"""

import os
import sys
import json
from datetime import datetime, timedelta

from google.oauth2 import service_account
from googleapiclient.discovery import build

# ===== 環境変数 =====

GA4_PROPERTY_ID = os.environ.get("ANTIGRAVITY_GA4_PROPERTY_ID")
GSC_SITE_URL = os.environ.get("ANTIGRAVITY_GSC_SITE_URL")
SERVICE_ACCOUNT_FILE = os.environ.get("ANTIGRAVITY_GA_GSC_KEY_FILE")

REQUIRED_ENV_VARS = {
    "ANTIGRAVITY_GA4_PROPERTY_ID": GA4_PROPERTY_ID,
    "ANTIGRAVITY_GSC_SITE_URL": GSC_SITE_URL,
    "ANTIGRAVITY_GA_GSC_KEY_FILE": SERVICE_ACCOUNT_FILE,
}


def validate_env_vars() -> None:
    missing = [name for name, value in REQUIRED_ENV_VARS.items() if not value]
    if missing:
        sys.stderr.write(
            "ERROR: Missing required environment variables:\n"
            + "\n".join(f"  - {name}" for name in missing)
            + "\n\n"
            "例:\n"
            "  ANTIGRAVITY_GA4_PROPERTY_ID=123456789 \\\n"
            "  ANTIGRAVITY_GSC_SITE_URL=https://prorenata.jp/ \\\n"
            "  ANTIGRAVITY_GA_GSC_KEY_FILE=./scripts/analytics/service-account-antigravity.json \\\n"
            "  python3 scripts/analytics/fetch-antigravity-analytics.py\n"
        )
        sys.exit(1)


# ===== 共通: 認証 =====

SCOPES = [
    "https://www.googleapis.com/auth/analytics.readonly",
    "https://www.googleapis.com/auth/webmasters.readonly",
]


def get_credentials():
    try:
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE,
            scopes=SCOPES,
        )
        return creds
    except Exception as e:
        sys.stderr.write(f"ERROR: サービスアカウントJSONの読み込みに失敗しました: {e}\n")
        sys.exit(1)


# ===== GA4: ページ別PV =====

def fetch_ga4_report(creds):
    """GA4 過去7日間の pagePath ごとの PV を取得"""
    analyticsdata = build("analyticsdata", "v1beta", credentials=creds)

    request_body = {
        "dateRanges": [{"startDate": "7daysAgo", "endDate": "today"}],
        "dimensions": [{"name": "pagePath"}],
        "metrics": [{"name": "screenPageViews"}],
        "limit": 50,
    }

    response = (
        analyticsdata.properties()
        .runReport(property=f"properties/{GA4_PROPERTY_ID}", body=request_body)
        .execute()
    )

    rows = []
    for row in response.get("rows", []):
        dim_vals = row.get("dimensionValues", [])
        met_vals = row.get("metricValues", [])
        record = {
            "pagePath": dim_vals[0]["value"] if len(dim_vals) > 0 else "",
            "screenPageViews": int(met_vals[0]["value"]) if len(met_vals) > 0 else 0,
        }
        rows.append(record)

    return {
        "property": f"properties/{GA4_PROPERTY_ID}",
        "row_count": len(rows),
        "rows": rows,
    }


# ===== Search Console: クエリ / ページ =====

def _fmt_date(d: datetime) -> str:
    return d.strftime("%Y-%m-%d")


def fetch_search_console_report(creds):
    """Search Console 過去7日間の query / page データを取得"""
    searchconsole = build("searchconsole", "v1", credentials=creds)

    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=7)

    request_body = {
        "startDate": _fmt_date(start_date),
        "endDate": _fmt_date(end_date),
        "dimensions": ["query", "page"],
        "rowLimit": 50,
    }

    response = (
        searchconsole.searchanalytics()
        .query(siteUrl=GSC_SITE_URL, body=request_body)
        .execute()
    )

    rows = []
    for row in response.get("rows", []):
        keys = row.get("keys", [])
        rows.append(
            {
                "query": keys[0] if len(keys) > 0 else "",
                "page": keys[1] if len(keys) > 1 else "",
                "clicks": row.get("clicks", 0),
                "impressions": row.get("impressions", 0),
                "ctr": row.get("ctr", 0.0),
                "position": row.get("position", 0.0),
            }
        )

    return {
        "site_url": GSC_SITE_URL,
        "row_count": len(rows),
        "rows": rows,
    }


# ===== メイン =====

def main():
    validate_env_vars()
    creds = get_credentials()

    result = {}

    try:
        print("Fetching GA4 report for Antigravity...", file=sys.stderr)
        result["ga4"] = fetch_ga4_report(creds)
    except Exception as e:
        sys.stderr.write(f"ERROR: GA4 取得に失敗しました: {e}\n")
        result["ga4_error"] = str(e)

    try:
        print("Fetching Search Console report for Antigravity...", file=sys.stderr)
        result["search_console"] = fetch_search_console_report(creds)
    except Exception as e:
        sys.stderr.write(f"ERROR: Search Console 取得に失敗しました: {e}\n")
        result["search_console_error"] = str(e)

    # 結果を JSON として標準出力
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
