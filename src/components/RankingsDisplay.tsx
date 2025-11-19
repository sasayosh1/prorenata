'use client'

import { useState, useEffect } from 'react'

interface RankingEntry {
  playerName: string
  score: number
  correctAnswers: number
  totalQuestions: number
  playedAt: string
}

export default function RankingsDisplay() {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly')
  const [rankings, setRankings] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRankings()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const fetchRankings = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/quiz/rankings?period=${period}`)
      if (!response.ok) {
        throw new Error('ランキングの取得に失敗しました')
      }

      const data = await response.json()
      setRankings(data.rankings || [])
    } catch (err) {
      console.error('Error fetching rankings:', err)
      setError('ランキングの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Period selector */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setPeriod('weekly')}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            period === 'weekly'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          週間ランキング
        </button>
        <button
          onClick={() => setPeriod('monthly')}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            period === 'monthly'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          月間ランキング
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">読み込み中...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-900">{error}</p>
          <button
            onClick={fetchRankings}
            className="mt-2 text-red-700 underline hover:text-red-900"
          >
            再読み込み
          </button>
        </div>
      )}

      {/* Rankings table */}
      {!loading && !error && (
        <>
          {rankings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">まだランキングデータがありません</p>
              <p className="text-sm text-gray-500 mt-2">
                クイズに挑戦して最初のランキング入りを目指しましょう！
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      順位
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      プレイヤー名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      スコア
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      正解率
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      プレイ日時
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rankings.map((entry, index) => {
                    const rank = index + 1
                    const accuracy = Math.round((entry.correctAnswers / entry.totalQuestions) * 100)

                    // Medal colors for top 3
                    let rankBadgeClass = 'bg-gray-200 text-gray-700'
                    if (rank === 1) rankBadgeClass = 'bg-yellow-400 text-yellow-900'
                    else if (rank === 2) rankBadgeClass = 'bg-gray-300 text-gray-800'
                    else if (rank === 3) rankBadgeClass = 'bg-orange-300 text-orange-900'

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${rankBadgeClass}`}>
                            {rank}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {entry.playerName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-semibold">
                            {entry.score}/{entry.totalQuestions}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${accuracy}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900">{accuracy}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(entry.playedAt).toLocaleDateString('ja-JP', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Call to action */}
      {!loading && !error && rankings.length > 0 && (
        <div className="mt-8 text-center">
          <a
            href="/quiz"
            className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            クイズに挑戦する
          </a>
        </div>
      )}
    </div>
  )
}
