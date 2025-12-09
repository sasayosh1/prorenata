import type { Post } from '@/lib/sanity'

// 句読点と記号を除去
const punctuationRegex = /[。、「」．，・!！?？()[\]{}\"']/g

// テキストの正規化
const normalizeText = (input: string = '') =>
  input
    .toLowerCase()
    .replace(punctuationRegex, ' ')
    .replace(/\s+/g, ' ')
    .trim()

// 日本語対応のトークン化（N-gram + スペース区切り）
const tokenize = (input: string): string[] => {
  const normalized = normalizeText(input)
  const tokens = new Set<string>()

  // スペース区切りのトークン
  normalized.split(' ').filter(Boolean).forEach(token => {
    tokens.add(token)

    // 2文字以上の場合、bi-gramも追加（日本語対応）
    if (token.length >= 2) {
      for (let i = 0; i < token.length - 1; i++) {
        tokens.add(token.substring(i, i + 2))
      }
    }
  })

  return Array.from(tokens)
}

// フィールドごとの重み付け
const FIELD_WEIGHTS: Record<string, number> = {
  title: 10,           // タイトルマッチを最重視
  excerpt: 5,          // 抜粋も重要
  categories: 3,       // カテゴリマッチ
  tags: 3,             // タグマッチ
  bodyPlainText: 1,    // 本文は基本スコア
}

// 部分一致スコアの計算
const computePartialMatchScore = (text: string, query: string): number => {
  if (!text || !query) return 0

  const normalizedText = normalizeText(text)
  const normalizedQuery = normalizeText(query)

  // 完全一致
  if (normalizedText === normalizedQuery) return 100

  // クエリ全体が含まれている
  if (normalizedText.includes(normalizedQuery)) return 50

  // 部分一致スコア
  let score = 0
  const queryChars = normalizedQuery.split('')
  const textChars = normalizedText.split('')

  queryChars.forEach(char => {
    if (textChars.includes(char)) {
      score += 1
    }
  })

  return (score / queryChars.length) * 10
}

// スコア計算（改善版）
const computeScore = (post: Post, query: string, tokens: string[]) => {
  if (!query || tokens.length === 0) return 0

  let totalScore = 0
  let matchedFields = 0

  const fields: Record<string, string> = {
    title: post.title || '',
    excerpt: post.excerpt || '',
    categories: Array.isArray(post.categories) ? post.categories.join(' ') : '',
    tags: Array.isArray(post.tags) ? post.tags.join(' ') : '',
    bodyPlainText: post.bodyPlainText || '',
  }

  // 各フィールドでスコアを計算
  Object.entries(fields).forEach(([fieldName, fieldValue]) => {
    if (!fieldValue) return

    const normalizedField = normalizeText(fieldValue)
    const weight = FIELD_WEIGHTS[fieldName] || 1

    // 1. クエリ全体の部分一致スコア
    const partialScore = computePartialMatchScore(fieldValue, query)
    if (partialScore > 0) {
      totalScore += partialScore * weight
      matchedFields++
    }

    // 2. トークンベースのマッチング
    let tokenMatches = 0
    tokens.forEach(token => {
      if (normalizedField.includes(token)) {
        tokenMatches++
      }
    })

    if (tokenMatches > 0) {
      // トークンマッチ率に応じてスコア加算
      const tokenScore = (tokenMatches / tokens.length) * 20
      totalScore += tokenScore * weight
      matchedFields++
    }
  })

  // マッチしたフィールドがない場合は0
  if (matchedFields === 0) return 0

  return totalScore
}

// 記事をクエリでランク付け
export const rankPostsByQuery = (posts: Post[], query: string) => {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) return []

  const tokens = tokenize(trimmedQuery)

  return posts
    .map(post => ({
      post,
      score: computeScore(post, trimmedQuery, tokens),
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.post)
}

// ハイライトスニペット生成
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
