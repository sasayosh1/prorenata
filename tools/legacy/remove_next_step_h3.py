import json
import re
from sanity_client import SanityClient # Assuming sanity_client.py exists

# Sanity configuration
SANITY_PROJECT_ID = '72m8vhy2'
DATASET = 'production'
SANITY_API_TOKEN = 'skPFlui2yNjyM39wGsffTHiC5yOPj0nwCA0Kw31sRVZAiijcOq1A6S8Gnr1KDa4mY9HJIxCXGGJcsOs45AWgsUQSmTbwBARZHaMvBSUwqgR8FMLwQZS8cH1NQ5qJg1A6gDs5ug7bImqm0rSONuGQYrFr3NdJ5bVKwVOr88KXzWBw7KLLcnAh'

# --- Helper to get all articles (similar to get_article_data_v2.py logic) ---
def fetch_all_articles_from_sanity(sanity_config):
    import requests
    import urllib.parse

    groq_query = '*[_type == "post"]{_id, title, "slug": slug.current, body}'
    encoded_query = urllib.parse.quote(groq_query)
    url = f"https://{sanity_config['projectId']}.api.sanity.io/v2021-03-25/data/query/{sanity_config['dataset']}?query={encoded_query}"
    headers = {"Authorization": f"Bearer {sanity_config['token']}"}

    response = requests.get(url, headers=headers)
    response.raise_for_status()
    data = response.json()['result'] # Access 'result' key
    return data

def remove_next_step_h3_from_article(article_body):
    new_body = []
    modified = False
    
    i = 0
    while i < len(article_body):
        block = article_body[i]
        
        if block.get('_type') == 'block':
            block_style = block.get('style')
            block_text = "".join([span.get('text', '') for span in block.get('children', [])]).strip()

            if block_style == 'h3' and block_text == 'より良い職場環境を探している方へ':
                modified = True
                # Skip this H3 block
                i += 1
                # Also skip the block immediately following it (which is usually the affiliate link placeholder)
                if i < len(article_body):
                    i += 1
                continue
        
        new_body.append(block)
        i += 1
    
    return new_body, modified

def main():
    # Sanity configuration
    SANITY_CONFIG = {
        'projectId': '72m8vhy2',
        'dataset': 'production',
        'token': SANITY_API_TOKEN
    }

    print("Sanityから全記事を取得中...")
    articles = fetch_all_articles_from_sanity(SANITY_CONFIG)
    print(f"取得した記事数: {len(articles)}件")

    sanity_client = SanityClient(
        project_id=SANITY_CONFIG['projectId'],
        dataset=SANITY_CONFIG['dataset'],
        token=SANITY_API_TOKEN,
        api_version='v1'
    )

    updated_count = 0
    for article in articles:
        original_body = article.get('body', [])
        modified_body, changes_made = remove_next_step_h3_from_article(original_body)

        if changes_made: # Check if changes were made
            try:
                sanity_client.patch(article['_id']).set(body=modified_body).commit()
                print(f"✅ Updated article: {article.get('title', article['_id'])}")
                updated_count += 1
            except Exception as e:
                print(f"❌ Error updating article {article.get('title', article['_id'])}: {e}")
        else:
            print(f"☑️ No changes needed for article: {article.get('title', article['_id'])}")
    
    print(f"\n--- Process Complete ---")
    print(f"Total articles processed: {len(articles)}")
    print(f"Total articles updated in Sanity: {updated_count}")

if __name__ == "__main__":
    # Need to ensure sanity_client.py is available
    main()
