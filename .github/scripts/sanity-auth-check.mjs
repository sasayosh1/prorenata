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
  const readToken = requiredEnv('SANITY_READ_TOKEN')
  const writeToken = requiredEnv('SANITY_WRITE_TOKEN')

  const readClient = createClient({
    projectId,
    dataset,
    apiVersion,
    token: readToken,
    useCdn: false,
  })
  const writeClient = createClient({
    projectId,
    dataset,
    apiVersion,
    token: writeToken,
    useCdn: false,
  })

  console.log(`[sanity-auth-check] projectId=${projectId} dataset=${dataset} apiVersion=${apiVersion}`)

  // 1) Authenticated read (forces token validation even if dataset is public)
  let readOk = false
  let writeOk = false
  try {
    const ping = await readClient.fetch(
      `{"now": now(), "postCount": count(*[_type == $type])}`,
      { type: optionalEnv('SANITY_POST_TYPE', 'post') }
    )
    readOk = true
    console.log('[sanity-auth-check] READ token OK:', ping)
  } catch (error) {
    console.error('[sanity-auth-check] READ token FAILED:', error?.message || error)
    if (error?.response?.body) {
      console.error('[sanity-auth-check] READ response:', JSON.stringify(error.response.body, null, 2))
    }
  }

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

  try {
    await writeClient.mutate([{ createOrReplace: testDoc }, { delete: { id: docId } }])
    writeOk = true
    console.log('[sanity-auth-check] WRITE token OK (createOrReplace+delete)')
  } catch (error) {
    console.error('[sanity-auth-check] WRITE token FAILED:', error?.message || error)
    if (error?.response?.body) {
      console.error('[sanity-auth-check] WRITE response:', JSON.stringify(error.response.body, null, 2))
    }
  }

  if (!readOk || !writeOk) {
    process.exitCode = 1
    console.error(
      `[sanity-auth-check] Result: READ=${readOk ? 'OK' : 'FAILED'} / WRITE=${writeOk ? 'OK' : 'FAILED'}`
    )
  } else {
    console.log('[sanity-auth-check] Result: READ=OK / WRITE=OK')
  }
}

main().catch((error) => {
  console.error('[sanity-auth-check] Failed:', error?.message || error)
  if (error?.response?.body) {
    console.error('[sanity-auth-check] Response:', JSON.stringify(error.response.body, null, 2))
  }
  process.exitCode = 1
})
