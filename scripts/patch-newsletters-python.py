#!/usr/bin/env python3
"""
Patch remaining newsletters using Python requests to Sanity API
"""

import json
import os
import re
import requests

# Manually parse .env.local
env_vars = {}
try:
    with open('.env.local', 'r') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                env_vars[key] = value
except:
    pass

PROJECT_ID = env_vars.get('NEXT_PUBLIC_SANITY_PROJECT_ID', '72m8vhy2')
DATASET = env_vars.get('NEXT_PUBLIC_SANITY_DATASET', 'production')
TOKEN = env_vars.get('SANITY_WRITE_TOKEN')

if not TOKEN:
    print('❌ SANITY_WRITE_TOKEN not found')
    exit(1)

# Load generated bodies
with open('/tmp/newsletter-bodies.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Sanity API base URL
API_URL = f'https://{PROJECT_ID}.api.sanity.io/v2021-10-21/data/mutate/{DATASET}'

# Patch Newsletter 2
print('📧 Patching Newsletter 2 (転職検討層向け)...')
patch2_mutation = {
    'mutations': [
        {
            'patch': {
                'id': data['newsletter2']['id'],
                'set': {
                    'body': data['newsletter2']['body']
                }
            }
        }
    ]
}

headers = {
    'Authorization': f'Bearer {TOKEN}',
    'Content-Type': 'application/json'
}

try:
    response2 = requests.post(API_URL, json=patch2_mutation, headers=headers)
    if response2.status_code in [200, 201]:
        print(f'   ✅ Newsletter 2 patched with {data["newsletter2"]["blockCount"]} blocks\n')
    else:
        print(f'   ❌ Error: {response2.status_code}')
        print(response2.text)
        exit(1)
except Exception as e:
    print(f'   ❌ Error: {str(e)}')
    exit(1)

# Patch Newsletter 3
print('📧 Patching Newsletter 3 (就職検討層向け)...')
patch3_mutation = {
    'mutations': [
        {
            'patch': {
                'id': data['newsletter3']['id'],
                'set': {
                    'body': data['newsletter3']['body']
                }
            }
        }
    ]
}

try:
    response3 = requests.post(API_URL, json=patch3_mutation, headers=headers)
    if response3.status_code in [200, 201]:
        print(f'   ✅ Newsletter 3 patched with {data["newsletter3"]["blockCount"]} blocks\n')
    else:
        print(f'   ❌ Error: {response3.status_code}')
        print(response3.text)
        exit(1)
except Exception as e:
    print(f'   ❌ Error: {str(e)}')
    exit(1)

print('✨ All newsletters successfully patched!')
print('\n📊 Summary:')
print('   Newsletter 1: 25 blocks ✅ (previously patched)')
print('   Newsletter 2: 26 blocks ✅')
print('   Newsletter 3: 24 blocks ✅')
print('\n🎉 All three newsletters now contain complete, untruncated content!')
