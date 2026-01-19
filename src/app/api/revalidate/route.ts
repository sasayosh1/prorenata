import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

/**
 * Revalidate API for prorenata.jp
 * Preferred auth: Authorization: Bearer <secret>
 */

function extractSecret(request: NextRequest, bodySecret?: string | null) {
  const auth = request.headers.get('authorization')
  if (auth?.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim()
  }

  const headerSecret = request.headers.get('x-revalidate-secret')
  if (headerSecret) return headerSecret.trim()

  const { searchParams } = new URL(request.url)
  const querySecret = searchParams.get('secret')
  if (querySecret) return querySecret.trim()

  if (bodySecret) return String(bodySecret).trim()
  return ''
}

function normalizePaths(input: unknown) {
  if (!input) return []
  if (Array.isArray(input)) {
    return input.filter((p) => typeof p === 'string' && p.startsWith('/'))
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.startsWith('/'))
  }
  return []
}

function isAuthorized(secret: string) {
  const expected = process.env.REVALIDATE_SECRET
  return Boolean(expected && secret && secret === expected)
}

async function handleRevalidate(paths: string[]) {
  const unique = Array.from(new Set(paths))
  if (unique.length === 0) {
    return NextResponse.json({ ok: false, error: 'Path(s) required' }, { status: 400 })
  }

  try {
    unique.forEach((path) => revalidatePath(path))
    return NextResponse.json({ ok: true, revalidated: unique })
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Revalidation failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const secret = extractSecret(request, null)
  if (!isAuthorized(secret)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const paths = normalizePaths(searchParams.get('path') || searchParams.get('paths'))
  return handleRevalidate(paths)
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const secret = extractSecret(request, typeof body?.secret === 'string' ? body.secret : null)
  if (!isAuthorized(secret)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const paths = normalizePaths(body?.paths || body?.path)
  return handleRevalidate(paths)
}
