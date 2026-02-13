export $(grep -v '^#' .env.local | xargs)
export SANITY_READ_TOKEN=$SANITY_API_TOKEN
export SANITY_WRITE_TOKEN=$SANITY_API_TOKEN
# Disable analytics to force fallback/priority logic
export ANALYTICS_MODE=disabled
# We want to see if it picks the first priority keyword "看護助手から看護師"
# We can't easily mock the Sanity client here, so we'll rely on the script's logging.
# If it logs "✨ Priority keyword selected", we know it works.
node scripts/run-daily-generation.cjs
