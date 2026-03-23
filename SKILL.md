# ProReNata Maintenance Skills

## Skill: SanityDataPatch
**Context**: Updating article fields in Sanity CMS.
**Procedure**:
1. Identify the document ID.
2. Use `sanity dataset export` for backup if complex.
3. Write a temporary script in `scripts/tmp/` using `sanityClient.patch()`.
4. Run with `SANITY_WRITE_TOKEN`.
5. Verify the change via `scripts/dump-article.js`.

## Skill: ArticleCompliance
**Context**: Ensuring YMYL compliance.
**Procedure**:
1. Load `00_システム/02_コンプライアンス/Legal_Word_Dictionary.md`.
2. Scan for forbidden patterns.
3. Suggest replacements based on the "推奨表現" column.
