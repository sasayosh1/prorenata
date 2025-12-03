#!/usr/bin/env python3
"""
SEOパフォーマンス分析スクリプト

GSCとGA4のデータを組み合わせて、SEO分析レポートを生成します。
- トップページ分析
- クエリパフォーマンス
- デバイス別分析
- 改善ポイント提案
"""

import os
import sys
from datetime import date
import pandas as pd

def analyze_top_pages(gsc_df, ga4_df):
    """トップページ分析"""
    print("\n📄 トップページ分析")

    # GSC: ページ別集計
    gsc_pages = gsc_df.groupby("page").agg({
        "clicks": "sum",
        "impressions": "sum",
        "ctr": "mean",
        "position": "mean",
    }).reset_index()

    # GA4: ページ別集計
    ga4_pages = ga4_df.groupby("pagePath").agg({
        "sessions": "sum",
        "totalUsers": "sum",
        "engagementRate": "mean",
    }).reset_index()

    # マージ（ページパスが完全一致する場合のみ）
    merged = pd.merge(
        gsc_pages,
        ga4_pages,
        left_on="page",
        right_on="pagePath",
        how="left"
    )

    # トップ10ページ（クリック数順）
    top_pages = merged.nlargest(10, "clicks")

    report = []
    report.append("\n### トップ10ページ（クリック数順）\n")
    report.append("| ページ | クリック | 表示回数 | CTR | 掲載順位 | セッション |")
    report.append("|--------|---------|---------|-----|---------|-----------|")

    for _, row in top_pages.iterrows():
        page = row["page"].replace("https://prorenata.jp", "")[:50]
        clicks = int(row["clicks"])
        impressions = int(row["impressions"])
        ctr = row["ctr"] * 100
        position = row["position"]
        sessions = int(row["sessions"]) if pd.notna(row["sessions"]) else 0

        report.append(
            f"| {page} | {clicks:,} | {impressions:,} | {ctr:.2f}% | {position:.1f} | {sessions:,} |"
        )

    return "\n".join(report)

def analyze_queries(gsc_df):
    """検索クエリ分析"""
    print("\n🔍 検索クエリ分析")

    # クエリ別集計
    queries = gsc_df.groupby("query").agg({
        "clicks": "sum",
        "impressions": "sum",
        "ctr": "mean",
        "position": "mean",
    }).reset_index()

    # トップ20クエリ（クリック数順）
    top_queries = queries.nlargest(20, "clicks")

    report = []
    report.append("\n### トップ20検索クエリ（クリック数順）\n")
    report.append("| 検索クエリ | クリック | 表示回数 | CTR | 掲載順位 |")
    report.append("|-----------|---------|---------|-----|---------|")

    for _, row in top_queries.iterrows():
        query = row["query"][:40]
        clicks = int(row["clicks"])
        impressions = int(row["impressions"])
        ctr = row["ctr"] * 100
        position = row["position"]

        report.append(
            f"| {query} | {clicks:,} | {impressions:,} | {ctr:.2f}% | {position:.1f} |"
        )

    return "\n".join(report)

def analyze_improvement_opportunities(gsc_df):
    """改善機会分析"""
    print("\n💡 改善機会分析")

    # クエリ別集計
    queries = gsc_df.groupby("query").agg({
        "clicks": "sum",
        "impressions": "sum",
        "ctr": "mean",
        "position": "mean",
    }).reset_index()

    # 改善機会: 表示回数は多いがCTRが低い（5%未満）
    low_ctr = queries[
        (queries["impressions"] >= 100) &
        (queries["ctr"] < 0.05)
    ].nlargest(10, "impressions")

    # 改善機会: 掲載順位が4-10位（1ページ目だが上位ではない）
    near_top = queries[
        (queries["position"] >= 4) &
        (queries["position"] <= 10) &
        (queries["impressions"] >= 50)
    ].nlargest(10, "impressions")

    report = []

    # CTR改善機会
    report.append("\n### CTR改善機会（表示回数多いが低CTR）\n")
    report.append("| 検索クエリ | 表示回数 | CTR | 掲載順位 | 改善提案 |")
    report.append("|-----------|---------|-----|---------|---------|")

    for _, row in low_ctr.iterrows():
        query = row["query"][:35]
        impressions = int(row["impressions"])
        ctr = row["ctr"] * 100
        position = row["position"]

        suggestion = "タイトル・説明文の見直し"
        if position > 5:
            suggestion = "掲載順位改善が優先"

        report.append(
            f"| {query} | {impressions:,} | {ctr:.2f}% | {position:.1f} | {suggestion} |"
        )

    # 掲載順位改善機会
    report.append("\n### 掲載順位改善機会（4-10位で表示回数多い）\n")
    report.append("| 検索クエリ | 表示回数 | 掲載順位 | CTR | 改善提案 |")
    report.append("|-----------|---------|---------|-----|---------|")

    for _, row in near_top.iterrows():
        query = row["query"][:35]
        impressions = int(row["impressions"])
        position = row["position"]
        ctr = row["ctr"] * 100

        report.append(
            f"| {query} | {impressions:,} | {position:.1f} | {ctr:.2f}% | 内部リンク・コンテンツ強化 |"
        )

    return "\n".join(report)

def generate_summary(gsc_df, ga4_df):
    """サマリー生成"""
    print("\n📈 サマリー生成")

    # GSC集計
    total_clicks = gsc_df["clicks"].sum()
    total_impressions = gsc_df["impressions"].sum()
    avg_ctr = gsc_df["ctr"].mean()
    avg_position = gsc_df["position"].mean()

    # GA4集計
    total_sessions = ga4_df["sessions"].sum()
    total_users = ga4_df["totalUsers"].sum()
    avg_engagement = ga4_df["engagementRate"].mean()

    summary = f"""
## SEOパフォーマンスサマリー（過去30日間）

### 全体指標

**Search Console**
- 総クリック数: {total_clicks:,}
- 総表示回数: {total_impressions:,}
- 平均CTR: {avg_ctr*100:.2f}%
- 平均掲載順位: {avg_position:.1f}

**Google Analytics 4**
- 総セッション数: {total_sessions:,}
- 総ユーザー数: {total_users:,}
- 平均エンゲージメント率: {avg_engagement*100:.2f}%
"""

    return summary

    return summary

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='SEO Performance Analysis')
    parser.add_argument('--gsc-data', default='data/gsc_last30d.csv', help='Path to GSC data CSV')
    parser.add_argument('--ga4-data', default='data/ga4_last30d.csv', help='Path to GA4 data CSV')
    parser.add_argument('--output', default=None, help='Path to output report file')
    
    args = parser.parse_args()

    print("📊 SEOパフォーマンス分析開始")

    # ファイル存在確認
    if not os.path.exists(args.gsc_data):
        # 拡張子が違う場合のフォールバック（ワークフローでjson指定されているが実態はcsvの場合など）
        base, _ = os.path.splitext(args.gsc_data)
        if os.path.exists(base + ".csv"):
            args.gsc_data = base + ".csv"
        else:
            print(f"❌ エラー: {args.gsc_data} が見つかりません")
            sys.exit(1)

    if not os.path.exists(args.ga4_data):
         print(f"❌ エラー: {args.ga4_data} が見つかりません")
         sys.exit(1)

    # データ読み込み
    print(f"📥 データ読み込み中... ({args.gsc_data}, {args.ga4_data})")
    try:
        gsc_df = pd.read_csv(args.gsc_data)
        ga4_df = pd.read_csv(args.ga4_data)
    except Exception as e:
        print(f"❌ データ読み込みエラー: {e}")
        sys.exit(1)

    print(f"   GSCデータ: {len(gsc_df):,}行")
    print(f"   GA4データ: {len(ga4_df):,}行")

    # 分析実行
    summary = generate_summary(gsc_df, ga4_df)
    top_pages = analyze_top_pages(gsc_df, ga4_df)
    queries = analyze_queries(gsc_df)
    improvements = analyze_improvement_opportunities(gsc_df)

    # レポート生成
    report_date = date.today().isoformat()
    report = f"""# SEOパフォーマンスレポート

**生成日時**: {report_date}

{summary}

{top_pages}

{queries}

{improvements}

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
"""

    # レポート保存
    if args.output:
        output_file = args.output
    else:
        output_file = f"data/seo_report_{report_date}.md"
        
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"\n✅ レポート生成完了: {output_file}")

if __name__ == "__main__":
    main()
