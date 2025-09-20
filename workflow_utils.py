import json
import os
from datetime import datetime, timedelta

STATE_FILE = "prorenata/.workflow_state.json"
LAST_PICK_FILE = "prorenata/.last_pick.json"
MAX_ATTEMPTS = 3
LOCK_TTL_MINUTES = 30
MIN_BODY_LENGTH = 120 # Minimum length for a non-placeholder body

PROJECT_ID = "72m8vhy2"
DATASET = "production"
API_TOKEN = "skCHyaNwM7IJU5RSAkrE3ZGFEYVcXx3lJzbKIz0a8HNUJmTwHRn1phhfsAYXZSeAVeWo2ogJj0COIwousCyb2MLGPwyxe4FuDbDETY2xz5hkjuUIcdz6YcubOZ5SfRywxB2Js8r4vKtbOmlbLm1pXJyHl0Kgajis2MgxilYSTpkEYe6GGWEu"

def get_current_time_iso():
    return datetime.now().isoformat() + "Z"

def read_workflow_state():
    if not os.path.exists(STATE_FILE):
        return {}
    with open(STATE_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def write_workflow_state(state):
    with open(STATE_FILE, 'w', encoding='utf-8') as f:
        json.dump(state, f, indent=2, ensure_ascii=False)

def read_last_pick_state():
    if not os.path.exists(LAST_PICK_FILE):
        return {"last_picked_id": None, "picked_at": None}
    with open(LAST_PICK_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def write_last_pick_state(article_id):
    state = {"last_picked_id": article_id, "picked_at": get_current_time_iso()}
    with open(LAST_PICK_FILE, 'w', encoding='utf-8') as f:
        json.dump(state, f, indent=2, ensure_ascii=False)

def is_placeholder(body_content):
    if body_content is None:
        return True
    if isinstance(body_content, list):
        # Check for empty list
        if not body_content:
            return True
        
        total_text_length = 0
        for block in body_content:
            if block.get('_type') == 'block' and block.get('children'):
                for child in block['children']:
                    if child.get('_type') == 'span' and child.get('text'):
                        total_text_length += len(child['text'].strip())
        
        # Check for specific "Empty" placeholder block (still relevant if it's the only block)
        if len(body_content) == 1 and body_content[0].get('_type') == 'block' and \
           body_content[0].get('style') == 'normal' and \
           body_content[0].get('children') and len(body_content[0]['children']) == 1 and \
           body_content[0]['children'][0].get('_type') == 'span' and \
           body_content[0]['children'][0].get('text') == 'Empty':
            return True

        if total_text_length < MIN_BODY_LENGTH:
            return True

    elif isinstance(body_content, str):
        # Check for specific string placeholders
        lower_content = body_content.lower().strip()
        if not lower_content:
            return True
        if lower_content in ["todo", "wip", "draft", "本文をここに", "下書き", "tbd", "執筆中"]:
            return True
        if lower_content.startswith("lorem ipsum"):
            return True
        # Check for plain string length
        if len(body_content.strip()) < MIN_BODY_LENGTH:
            return True
    return False

def log_workflow_event(article_id, status, attempts, summary, last_error=""):
    event = {
        "timestamp": get_current_time_iso(),
        "articleId": article_id,
        "status": status,
        "attempts": attempts,
        "summary": summary,
        "lastError": last_error
    }
    print(json.dumps(event, ensure_ascii=False))