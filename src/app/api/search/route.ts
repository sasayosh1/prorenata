import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'next-sanity'

const projectId = '72m8vhy2'
const dataset = 'production'
const apiVersion = '2024-01-01'

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
})

// interface SearchFilters {
//   category?: string
//   difficulty?: string
//   contentType?: string
//   readingTime?: string
//   sortBy?: string
// }

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const difficulty = searchParams.get('difficulty') || ''
    const contentType = searchParams.get('contentType') || ''
    const readingTime = searchParams.get('readingTime') || ''
    const sortBy = searchParams.get('sortBy') || 'relevance'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // 最大50件

    // 基本的なSanityクエリを構築
    let sanityQuery = `*[_type == "post" && defined(publishedAt)`

    // フィルター条件を追加
    const conditions = []
    
    // カテゴリーフィルター
    if (category) {
      conditions.push(`"${category}" in categories[]->title`)
    }
    
    // 難易度フィルター
    if (difficulty) {
      conditions.push(`difficulty == "${difficulty}"`)
    }
    
    // コンテンツタイプフィルター
    if (contentType) {
      conditions.push(`contentType == "${contentType}"`)
    }
    
    // 読了時間フィルター
    if (readingTime) {
      const [min, max] = readingTime.split('-').map(Number)
      if (readingTime.includes('+')) {
        conditions.push(`readingTime >= ${min}`)
      } else if (max) {
        conditions.push(`readingTime >= ${min} && readingTime <= ${max}`)
      } else {
        conditions.push(`readingTime <= ${min}`)
      }
    }
    
    // テキスト検索条件
    if (query) {
      const searchCondition = `(
        title match "*${query}*" ||
        excerpt match "*${query}*" ||
        pt::text(body) match "*${query}*" ||
        focusKeyword match "*${query}*" ||
        "${query}" in relatedKeywords[] ||
        "${query}" in tags[]
      )`
      conditions.push(searchCondition)
    }

    // 条件を結合
    if (conditions.length > 0) {
      sanityQuery += ` && ${conditions.join(' && ')}`
    }

    sanityQuery += `]`

    // ソート条件を追加
    switch (sortBy) {
      case 'newest':
        sanityQuery += ` | order(publishedAt desc)`
        break
      case 'oldest':
        sanityQuery += ` | order(publishedAt asc)`
        break
      case 'reading-time-asc':
        sanityQuery += ` | order(readingTime asc)`
        break
      case 'reading-time-desc':
        sanityQuery += ` | order(readingTime desc)`
        break
      case 'relevance':
      default:
        // 関連度順（デフォルト）
        sanityQuery += ` | order(publishedAt desc)`
        break
    }

    // ページネーション
    const offset = (page - 1) * limit
    sanityQuery += ` [${offset}...${offset + limit}]`

    // フィールドを指定
    sanityQuery += ` {
      _id,
      title,
      slug,
      publishedAt,
      _updatedAt,
      excerpt,
      focusKeyword,
      relatedKeywords,
      contentType,
      targetAudience,
      difficulty,
      readingTime,
      featured,
      tags,
      "categories": categories[]->title,
      "author": author->{name, slug},
      // スコア計算用のフィールド
      "searchScore": select(
        title match "*${query}*" => 10,
        focusKeyword match "*${query}*" => 8,
        "${query}" in tags[] => 6,
        excerpt match "*${query}*" => 4,
        "${query}" in relatedKeywords[] => 3,
        pt::text(body) match "*${query}*" => 2,
        0
      )
    }`

    console.log('Executing search query:', sanityQuery)

    const posts = await client.fetch(sanityQuery)

    // 関連度順でソートする場合は、検索スコアでソート
    if (sortBy === 'relevance' && query) {
      posts.sort((a: { searchScore?: number; publishedAt: string }, b: { searchScore?: number; publishedAt: string }) => {
        // 検索スコアで基本的なソート
        const scoreA = a.searchScore || 0
        const scoreB = b.searchScore || 0
        if (scoreB !== scoreA) {
          return scoreB - scoreA
        }
        
        // 同じスコアの場合は新しい順
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      })
    }

    // 総件数を取得（別クエリ）
    let countQuery = `count(*[_type == "post" && defined(publishedAt)`
    if (conditions.length > 0) {
      countQuery += ` && ${conditions.join(' && ')}`
    }
    countQuery += `])`

    const totalCount = await client.fetch(countQuery)

    // 検索統計情報
    const stats = {
      totalResults: totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      resultsPerPage: limit,
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1,
    }

    // カテゴリー別の件数（集計情報）
    const categoryStats = await client.fetch(`
      *[_type == "post" && defined(publishedAt) ${query ? `&& (
        title match "*${query}*" ||
        excerpt match "*${query}*" ||
        pt::text(body) match "*${query}*" ||
        focusKeyword match "*${query}*" ||
        "${query}" in relatedKeywords[] ||
        "${query}" in tags[]
      )` : ''}] {
        "categories": categories[]->title
      } | {
        "categories": categories[defined(@)]
      }
    `)

    const categoryCounts = categoryStats
      .flatMap((post: { categories?: string[] }) => post.categories || [])
      .reduce((acc: Record<string, number>, category: string) => {
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {})

    return NextResponse.json({
      success: true,
      data: {
        posts: posts.map((post: { searchScore?: number; [key: string]: unknown }) => {
          // searchScore を除外してクライアントに返す
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { searchScore, ...postWithoutScore } = post
          return postWithoutScore
        }),
        stats,
        categoryCounts,
        appliedFilters: {
          query,
          category,
          difficulty,
          contentType,
          readingTime,
          sortBy,
        }
      }
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search posts',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// 検索候補を提供するエンドポイント
export async function POST(request: NextRequest) {
  try {
    const { query, limit = 10 } = await request.json()

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          suggestions: [],
          popularKeywords: [
            '看護助手 給料', '未経験', '夜勤', 'ボーナス', '志望動機',
            '面接', '医療用語', '患者移送', '制服', '転職'
          ]
        }
      })
    }

    // タイトルからの候補
    const titleSuggestions = await client.fetch(`
      *[_type == "post" && title match "*${query}*"][0...${Math.min(limit, 20)}] {
        title
      } | order(title asc)
    `)

    // タグからの候補
    const tagSuggestions = await client.fetch(`
      array::unique(*[_type == "post" && "${query}" in tags[]][0...50].tags[]) | [@ match "*${query}*"][0...${Math.min(limit, 10)}]
    `)

    // フォーカスキーワードからの候補
    const keywordSuggestions = await client.fetch(`
      *[_type == "post" && focusKeyword match "*${query}*"][0...${Math.min(limit, 10)}] {
        focusKeyword
      } | order(focusKeyword asc)
    `)

    const suggestions = [
      ...titleSuggestions.map((item: { title: string }) => ({
        type: 'title',
        value: item.title,
        label: item.title
      })),
      ...tagSuggestions.map((tag: string) => ({
        type: 'tag',
        value: tag,
        label: `#${tag}`
      })),
      ...keywordSuggestions.map((item: { focusKeyword: string }) => ({
        type: 'keyword',
        value: item.focusKeyword,
        label: item.focusKeyword
      })),
    ]

    // 重複を除去し、制限数まで絞る
    const uniqueSuggestions = suggestions
      .filter((item, index, self) => 
        self.findIndex(s => s.value === item.value) === index
      )
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      data: {
        suggestions: uniqueSuggestions,
        query
      }
    })

  } catch (error) {
    console.error('Search suggestions API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get search suggestions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}