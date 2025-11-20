import type { Post } from '@/lib/sanity'

const punctuationRegex = /[。、「」、．，・!！?？()\[\]{}"']/g

const normalizeText = (input: string = '') =>
  input
    .toLowerCase()
    .replace(punctuationRegex, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const tokenize = (input: string) =>
  Array.from(new Set(normalizeText(input).split(' ').filter(Boolean)))

const FIELD_WEIGHTS: Record<string, number> = {
  title: 4,
  excerpt: 2,
  categories: 1.5,
  tags: 1.5,
  bodyPlainText: 1,
}

const MIN_TOKEN_MATCHES = 1

const computeScore = (post: Post, tokens: string[]) => {
  if (tokens.length === 0) return 0

  let score = 0
  let matchedTokens = 0

  const fields: Record<string, string> = {
    title: post.title || '',
    excerpt: post.excerpt || '',
    categories: Array.isArray(post.categories) ? post.categories.join(' ') : '',
    tags: Array.isArray(post.tags) ? post.tags.join(' ') : '',
    bodyPlainText: post.bodyPlainText || '',
  }

  const normalizedFields = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, normalizeText(value || '')])
  )

  tokens.forEach(token => {
    let tokenMatched = false
    Object.entries(normalizedFields).forEach(([field, value]) => {
      if (!value) return
      if (value.includes(token)) {
        score += FIELD_WEIGHTS[field] || 1
        tokenMatched = true
      }
    })
    if (tokenMatched) matchedTokens += 1
  })

  if (matchedTokens < MIN_TOKEN_MATCHES) {
    return 0
  }

  return score
}

export const rankPostsByQuery = (posts: Post[], query: string) => {
  const tokens = tokenize(query)
  if (tokens.length === 0) return []

  return posts
    .map(post => ({
      post,
      score: computeScore(post, tokens),
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.post)
}

const SNIPPET_RADIUS = 60

export const buildHighlightSnippet = (text: string, query: string) => {
  if (!text) return ''
  const normalizedText = text.replace(/\s+/g, ' ')
  const lower = normalizedText.toLowerCase()
  const lowerQuery = query.toLowerCase().trim()

  const index = lower.indexOf(lowerQuery)
  if (index === -1) {
    return normalizedText.slice(0, SNIPPET_RADIUS * 2)
  }

  const start = Math.max(0, index - SNIPPET_RADIUS)
  const end = Math.min(normalizedText.length, index + lowerQuery.length + SNIPPET_RADIUS)
  return `${start > 0 ? '…' : ''}${normalizedText.slice(start, end)}${end < normalizedText.length ? '…' : ''}`
}
