# -*- coding: utf-8 -*-
import requests
import json
import os
import sys

# Sanity project details
PROJECT_ID = "72m8vhy2"
DATASET = "production"
API_TOKEN = "skMFpCccii6DeosxmnEc47RikE1kkdwAgOJ2L4PNgi6bAfRMQn8tuSl8S0FFYUBoxdDAcnzzhWdaydpaAxhcrxVwHSL7OUK7HgRflDFh3YjlcEFFdOY4Oz2L6Dz2Q9ev3D1gUbQ0Wn4GelO1fSPnEP7JdwNXoxyKNsJ5Hh4Fsz8N95b3U4VP"

# Load article data from article.json
try:
    with open('article.json', 'r', encoding='utf-8') as f:
        article_data = json.load(f)
except FileNotFoundError:
    print("Error: article.json not found. Please ensure the article is extracted to article.json.")
    sys.exit(1)
except json.JSONDecodeError:
    print("Error: Could not decode article.json. Please check its content.")
    sys.exit(1)

article_id = article_data.get('_id')
excerpt = article_data.get('excerpt')
body = article_data.get('body')

if not article_id:
    print("Error: '_id' not found in article.json.")
    sys.exit(1)
if not excerpt:
    print("Error: 'excerpt' not found in article.json.")
    sys.exit(1)
if not body:
    print("Error: 'body' not found in article.json.")
    sys.exit(1)

# Ensure API_TOKEN is set
if not API_TOKEN:
    print("Error: Sanity API token is not set. Please set the API_TOKEN variable.")
    sys.exit(1)

# Construct the mutation
mutations = {
    "mutations": [
        {
            "patch": {
                "id": article_id,
                "set": {
                    "body": body,
                    "excerpt": excerpt
                }
            }
        }
    ]
}

# Construct the API request
url = f"https://{PROJECT_ID}.api.sanity.io/v2021-03-25/data/mutate/{DATASET}"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_TOKEN}"
}

# Make the request
print(f"Updating article {article_id} in Sanity...")
response = requests.post(url, headers=headers, data=json.dumps(mutations))

# Print the response
if response.status_code == 200:
    print("Successfully updated article in Sanity.")
else:
    print(f"Failed to update article. Status code: {response.status_code}")
    sys.exit(1)
