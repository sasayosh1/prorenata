import process from 'node:process'
import { createClient } from '@sanity/client'

function requiredEnv(name) {
  const value = process.env[name]
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required ENV/Secret: ${name}`)
  }
  return String(value).trim()
}

function optionalEnv(name, fallback = '') {
  const value = process.env[name]
  return value ? String(value).trim() : fallback
}

async function main() {
  const projectId = requiredEnv('SANITY_PROJECT_ID')
  const dataset = requiredEnv('SANITY_DATASET')
  const apiVersion = requiredEnv('SANITY_API_VERSION')
  const token = requiredEnv('SANITY_WRITE_TOKEN')

  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
  })

  console.log(`[sanity-auth-check] projectId=${projectId} dataset=${dataset} apiVersion=${apiVersion}`)

  // 1) Authenticated read (forces token validation even if dataset is public)
  const ping = await client.fetch(
    `{"now": now(), "postCount": count(*[_type == $type])}`,
    { type: optionalEnv('SANITY_POST_TYPE', 'post') }
  )
  console.log('[sanity-auth-check] authenticated fetch ok:', ping)

  // 2) Write permission check (create + delete in one mutate call to avoid lasting data)
  const runId =
    process.env.GITHUB_RUN_ID ||
    process.env.GITHUB_SHA?.slice(0, 7) ||
    `local-${Date.now().toString(16)}`
  const docId = `authcheck.${runId}`

  const testDoc = {
    _id: docId,
    _type: 'authCheck',
    createdAt: new Date().toISOString(),
    note: 'temporary doc created by GitHub Actions sanity-auth-check',
  }

  await client.mutate([{ createOrReplace: testDoc }, { delete: { id: docId } }])
  console.log('[sanity-auth-check] write ok (createOrReplace+delete)')
}

main().catch((error) => {
  console.error('[sanity-auth-check] Failed:', error?.message || error)
  if (error?.response?.body) {
    console.error('[sanity-auth-check] Response:', JSON.stringify(error.response.body, null, 2))
  }
  process.exitCode = 1
})

