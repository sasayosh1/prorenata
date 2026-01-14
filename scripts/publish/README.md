# Sanity Article Ingestion Script

This script handles the robust ingestion of Markdown files into Sanity as `post` documents. It ensures slug uniqueness and handles conflicts between Published and Draft documents.

## Key Features

- **Deterministic IDs**: Uses `post-${slug}` as the base ID to prevent duplicate document creation.
- **Conflict Resolution**:
  - If a Published document exists with the same slug, it updates it.
  - If only Drafts exist, it takes the first one's base ID (or the deterministic ID) and upserts it as Published, then deletes the Drafts.
  - If multiple Published documents exist, it stops for safety (requires `--force-cleanup`).
- **Multiple Auth Methods**: Supports both API Token and Sanity CLI sessions.

## Usage

### Prerequisites
- `.env.local` containing `SANITY_PROJECT_ID` and `SANITY_DATASET`.
- For API access: `SANITY_WRITE_TOKEN`.
- For CLI access: Run `npx sanity login` first.

### Commands

**Dry Run (Default)**
```bash
node scripts/publish/ingest-markdown-to-sanity.js \
  --file drafts/my-article.md \
  --title "My Article" \
  --slug "my-article"
```

**Apply Changes (API Token)**
```bash
node scripts/publish/ingest-markdown-to-sanity.js \
  --file drafts/my-article.md \
  --title "My Article" \
  --slug "my-article" \
  --apply
```

**Apply Changes (CLI Session)**
```bash
node scripts/publish/ingest-markdown-to-sanity.js \
  --file drafts/my-article.md \
  --title "My Article" \
  --slug "my-article" \
  --apply \
  --use-cli
```

**Force Cleanup (When multiple Published docs collide)**
```bash
node scripts/publish/ingest-markdown-to-sanity.js \
  --file drafts/my-article.md \
  --title "My Article" \
  --slug "my-article" \
  --apply --force-cleanup
```

## Troubleshooting

### Collision Detected
If the script fails with `Multiple Published documents found`, it means Sanity has inconsistent data (multiple documents using the same slug).
1. Use `npx sanity documents query "*[slug.current == 'your-slug']"` to inspect.
2. Use `--force-cleanup` to keep the newest document and delete the others.

### Ingestion fails with "Permission Required"
- Ensure your API token has `Editor` or `Administrator` permissions.
- If using `--use-cli`, ensure you are logged into the correct Sanity account.
