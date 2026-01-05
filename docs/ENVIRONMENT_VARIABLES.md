# Environment Variables

The following environment variables are required for the project and maintenance scripts to function correctly.

## Core Site (Next.js)

- `NEXT_PUBLIC_SANITY_PROJECT_ID`: Sanity project ID.
- `NEXT_PUBLIC_SANITY_DATASET`: Sanity dataset (e.g., `production`).
- `NEXT_PUBLIC_SANITY_API_VERSION`: Sanity API version (e.g., `2024-01-01`).
- `SITE_URL`: Full URL of the site including protocol (e.g., `https://prorenata.jp`).

## Sanity & AI (Maintenance)

- `SANITY_API_TOKEN`: Sanity token with WRITE permissions (used for maintenance scripts).
- `ANTHROPIC_API_KEY`: API key for Claude (Anthropic).
- `GOOGLE_GENERATIVE_AI_API_KEY`: API key for Gemini (Google).
- `OPENAI_API_KEY`: API key for OpenAI (used for content expansion/generation).

## Third-Party Services

- `GOOGLE_SITE_VERIFICATION`: Token for Google Search Console.
- `BING_SITE_VERIFICATION`: Token for Bing Webmaster Tools.
- `GA_MEASUREMENT_ID`: Google Analytics 4 ID.

## Maintenance Settings

- `SANITY_DEV_LIMIT`: (Optional) Limits the number of posts fetched in development mode to speed up builds (default: 20).
