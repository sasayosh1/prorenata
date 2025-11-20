'use client'

import Link from 'next/link'

interface PaginationProps {
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  baseUrl: string
}

export default function Pagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  baseUrl
}: PaginationProps) {
  const generatePageNumbers = () => {
    const pages = []
    const maxVisiblePages = 7

    if (totalPages <= maxVisiblePages) {
      // 総ページ数が少ない場合は全て表示
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 総ページ数が多い場合は省略表示
      if (currentPage <= 4) {
        // 現在ページが前半の場合
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        // 現在ページが後半の場合
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // 現在ページが中央の場合
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  const pages = generatePageNumbers()

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="mt-8 space-y-3" aria-label="ページネーション">
      {/* Mobile condensed controls */}
      <div className="flex md:hidden items-center justify-between gap-3">
        {hasPrevPage ? (
          <Link
            href={currentPage === 2 ? baseUrl : `${baseUrl}?page=${currentPage - 1}`}
            className="flex-1 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            ← 前へ
          </Link>
        ) : (
          <span className="flex-1 inline-flex items-center justify-center rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-400 shadow-sm">
            ← 前へ
          </span>
        )}

        <span className="text-sm font-semibold text-gray-600 min-w-[80px] text-center">
          {currentPage}/{totalPages}
        </span>

        {hasNextPage ? (
          <Link
            href={`${baseUrl}?page=${currentPage + 1}`}
            className="flex-1 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            次へ →
          </Link>
        ) : (
          <span className="flex-1 inline-flex items-center justify-center rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-400 shadow-sm">
            次へ →
          </span>
        )}
      </div>

      <nav className="hidden md:flex justify-center items-center space-x-2" aria-label="ページ番号">
      {/* 前へボタン */}
      {hasPrevPage ? (
        <Link
          href={currentPage === 2 ? baseUrl : `${baseUrl}?page=${currentPage - 1}`}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          ← 前へ
        </Link>
      ) : (
        <span className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-100 border border-gray-200 rounded-md cursor-not-allowed">
          ← 前へ
        </span>
      )}

      {/* ページ番号 */}
      <div className="flex space-x-1">
        {pages.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-sm font-medium text-gray-400"
              >
                ...
              </span>
            )
          }

          const pageNum = page as number
          const isCurrentPage = pageNum === currentPage

          return (
            <Link
              key={pageNum}
              href={pageNum === 1 ? baseUrl : `${baseUrl}?page=${pageNum}`}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isCurrentPage
                  ? 'bg-blue-600 text-white border border-blue-600'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900'
              }`}
              aria-current={isCurrentPage ? 'page' : undefined}
            >
              {pageNum}
            </Link>
          )
        })}
      </div>

      {/* 次へボタン */}
      {hasNextPage ? (
        <Link
          href={`${baseUrl}?page=${currentPage + 1}`}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          次へ →
        </Link>
      ) : (
        <span className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-100 border border-gray-200 rounded-md cursor-not-allowed">
          次へ →
        </span>
      )}
      </nav>
    </div>
  )
}
