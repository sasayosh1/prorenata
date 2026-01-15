import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

function isAuthorized(secret: string | null) {
  const expected = process.env.REVALIDATE_SECRET
  return Boolean(expected && secret && secret === expected)
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

async function handleRevalidate(paths: string[]) {
  const unique = Array.from(new Set(paths))
  if (unique.length === 0) {
    return NextResponse.json({ ok: false, error: 'No paths provided' }, { status: 400 })
  }

  unique.forEach((path) => {
    revalidatePath(path)
  })

  return NextResponse.json({ ok: true, revalidated: unique })
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const secret = url.searchParams.get('secret')
  if (!isAuthorized(secret)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const paths = normalizePaths(url.searchParams.get('path') || url.searchParams.get('paths'))
  return handleRevalidate(paths)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const secret = typeof body?.secret === 'string' ? body.secret : null
  if (!isAuthorized(secret)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const paths = normalizePaths(body?.paths || body?.path)
  return handleRevalidate(paths)
}
