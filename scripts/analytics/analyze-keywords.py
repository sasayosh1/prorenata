import pandas as pd
import sys

def analyze_keywords(file_path):
    try:
        df = pd.read_csv(file_path)
        
        # Filter for queries containing "看護助手"
        df_filtered = df[df['query'].str.contains('看護助手', na=False)]
        
        # Group by query and calculate metrics
        keyword_stats = df_filtered.groupby('query').agg({
            'clicks': 'sum',
            'impressions': 'sum',
            'position': 'mean'
        }).reset_index()
        
        # Calculate CTR
        keyword_stats['ctr'] = (keyword_stats['clicks'] / keyword_stats['impressions']) * 100
        
        # 1. Currently performing well (High Clicks)
        print("\n=== 現在伸びているキーワード (クリック数順) ===")
        top_clicks = keyword_stats.sort_values('clicks', ascending=False).head(10)
        print(top_clicks[['query', 'clicks', 'impressions', 'position']].to_string(index=False))
        
        # 2. High Potential (High Impressions, Low Clicks/Rank)
        print("\n=== 今後伸びそうなキーワード (表示回数順, 掲載順位20位以内) ===")
        potential = keyword_stats[
            (keyword_stats['position'] <= 20) & 
            (keyword_stats['impressions'] > 5)
        ].sort_values('impressions', ascending=False).head(15)
        print(potential[['query', 'clicks', 'impressions', 'position', 'ctr']].to_string(index=False))

        # 3. Niche Opportunities (Good Rank, Low Impressions)
        print("\n=== ニッチな機会 (掲載順位10位以内, 表示回数少なめ) ===")
        niche = keyword_stats[
            (keyword_stats['position'] <= 10) & 
            (keyword_stats['impressions'] > 0) &
            (keyword_stats['impressions'] < 50)
        ].sort_values('position', ascending=True).head(10)
        print(niche[['query', 'clicks', 'impressions', 'position']].to_string(index=False))

    except Exception as e:
        print(f"Error analyzing data: {e}")

if __name__ == "__main__":
    analyze_keywords('data/gsc_last30d.csv')
