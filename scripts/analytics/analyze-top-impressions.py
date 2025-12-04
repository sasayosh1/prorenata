import pandas as pd
import sys

def analyze_top_impressions(file_path):
    try:
        df = pd.read_csv(file_path)
        # Group by page and sum impressions
        top_pages = df.groupby('page')['impressions'].sum().sort_values(ascending=False).head(10)
        
        print("Top 10 Articles by Impressions:")
        for page, impressions in top_pages.items():
            print(f"{page}: {impressions}")
            
    except Exception as e:
        print(f"Error analyzing data: {e}")

if __name__ == "__main__":
    analyze_top_impressions('data/gsc_last30d.csv')
