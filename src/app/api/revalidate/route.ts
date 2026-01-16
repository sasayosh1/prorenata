import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createHash } from 'crypto'

/**
 * Revalidate API for prorenata.jp
 * 
 * [Senior Engineer's Diagnostic Implementation]
 * Focus: Identify 401 Unauthorized causes without leaking secrets.
 */

function getSafeHash(str: string | undefined | null) {
  if (!str) return ""
  return createHash('sha256').update(str).digest('hex').substring(0, 8)
}

function normalizePaths(input: unknown): string[] {
  if (!input) return []
  if (Array.isArray(input)) return input.filter(p => typeof p === 'string')
  if (typeof input === 'string') return [input]
  return []
}

function getDiag(envSecret: string | undefined, secret: string | null, source: string) {
  return {
    hasEnv: Boolean(envSecret && envSecret.trim().length > 0),
    envLen: envSecret?.length || 0,
    providedLen: secret?.length || 0,
    envHash8: getSafeHash(envSecret),
    providedHash8: getSafeHash(secret),
    source,
    method: "", // To be filled by handler
    timestamp: new Date().toISOString()
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const path = searchParams.get('path')
  const envSecret = process.env.REVALIDATE_SECRET

  const isAuth = Boolean(envSecret && secret === envSecret)
  const diag = getDiag(envSecret, secret, secret ? "query" : "missing")
  diag.method = "GET"

  if (!isAuth) {
    return NextResponse.json({ ok: false, status: 401, ...diag }, { status: 401 })
  }

  if (!path) {
    return NextResponse.json({ ok: false, message: 'Path is required' }, { status: 400 })
  }

  try {
    revalidatePath(path)
    return NextResponse.json({ ok: true, revalidated: [path], now: new Date().toISOString() })
  } catch (err) {
    return NextResponse.json({ ok: false, message: 'Revalidation failed', error: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url)
  const envSecret = process.env.REVALIDATE_SECRET

  // 1. Secret Retrieval (Priority: Query -> JSON -> Form)
  let secret = url.searchParams.get('secret')
  let source = secret ? "query" : ""
  let body: Record<string, unknown> = {}
  let form: FormData | null = null

  if (!secret) {
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      body = (await request.json().catch(() => ({}))) as Record<string, unknown>
      secret = typeof body.secret === 'string' ? body.secret : null
      source = secret ? "json" : ""
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      form = await request.formData().catch(() => null)
      const formSecret = form?.get('secret')
      secret = typeof formSecret === 'string' ? formSecret : null
      source = secret ? "form" : ""
    }
  }

  if (!source) source = "missing"

  // 2. Auth Check
  const isAuth = Boolean(envSecret && secret === envSecret)
  const diag = getDiag(envSecret, secret, source)
  diag.method = "POST"

  if (!isAuth) {
    return NextResponse.json({ ok: false, status: 401, ...diag }, { status: 401 })
  }

  // 3. Path Retrieval
  const paths = [
    ...normalizePaths(url.searchParams.get('path')),
    ...normalizePaths(url.searchParams.getAll('paths')),
    ...normalizePaths(body?.path),
    ...normalizePaths(body?.paths),
    ...normalizePaths(form?.get('path')),
    ...normalizePaths(form?.getAll('paths'))
  ]

  const uniquePaths = Array.from(new Set(paths.filter(Boolean)))

  if (uniquePaths.length === 0) {
    return NextResponse.json({ ok: false, message: 'Path(s) required' }, { status: 400 })
  }

  try {
    for (const p of uniquePaths) {
      revalidatePath(p)
    }
    return NextResponse.json({ ok: true, revalidated: uniquePaths, now: new Date().toISOString() })
  } catch (err) {
    return NextResponse.json({ ok: false, message: 'Revalidation failed', error: String(err) }, { status: 500 })
  }
}
