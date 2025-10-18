import json
from sanity_client import SanityClient # Assuming sanity_client.py exists

# Sanity configuration
SANITY_PROJECT_ID = '72m8vhy2'
DATASET = 'production'
SANITY_API_TOKEN = 'skPFlui2yNjyM39wGsffTHiC5yOPj0nwCA0Kw31sRVZAiijcOq1A6S8Gnr1KDa4mY9HJIxCXGGJcsOs45AWgsUQSmTbwBARZHaMvBSUwqgR8FMLwQZS8cH1NQ5qJg1A6gDs5ug7bImqm0rSONjGQYrFr3NdJ5bVKwVOr88KXzWBw7KLLcnAh'

def get_all_articles(file_path):
    # This function will be similar to the modified get_article_data_v2.py
    # but will return the articles directly instead of saving to a file.
    # For now, I'll assume it reads from the local all-articles.json
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            articles = json.load(f)
        return articles
    except Exception as e:
        print(f"Error reading articles: {e}")
        return []

def remove_sections_from_article(article_body):
    new_body = []
    is_in_section_to_remove = False
    
    for block in article_body:
        if block.get('_type') == 'block':
            block_style = block.get('style')
            block_text = "".join([span.get('text', '') for span in block.get('children', [])]).strip()

            if block_style == 'h2' and (block_text == 'まとめ' or block_text == '次のステップ'):
                is_in_section_to_remove = True
                # Do not add this H2 block to new_body
                continue
            
            if is_in_section_to_remove:
                # If we encounter a new H2 or H3, stop removing
                if block_style == 'h2' or (block_style == 'h3' and block_text != 'より良い職場環境を探している方へ'):
                    is_in_section_to_remove = False
                    new_body.append(block) # Add this new heading
                else:
                    # Still in the section to remove, so skip this block
                    continue
            else:
                # Not in a section to remove, so keep the block
                new_body.append(block)
        else:
            # Non-block types (e.g., image, code) are always kept unless they are part of a removed section
            if not is_in_section_to_remove:
                new_body.append(block)
    
    return new_body

def main():
    articles_file = '/Users/user/prorenata/all-articles.json'
    articles = get_all_articles(articles_file)

    if not articles:
        print("No articles to process.")
        return

    sanity_client = SanityClient(
        project_id=SANITY_PROJECT_ID,
        dataset=DATASET,
        token=SANITY_API_TOKEN,
        api_version='v1'
    )

    updated_count = 0
    for article in articles:
        original_body = article.get('body', [])
        modified_body = remove_sections_from_article(original_body)

        if original_body != modified_body: # Check if changes were made
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
    # Ensure sanity_client.py is available
    # I will create a dummy sanity_client.py if it doesn't exist,
    # but it should exist from previous interactions.
    main()
