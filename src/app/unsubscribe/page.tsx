'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function UnsubscribePage() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const res = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setStatus('success')
        setMessage('メールマガジンの解約手続きが完了しました。')
      } else {
        const data = await res.json()
        setStatus('error')
        setMessage(data.message || 'エラーが発生しました。もう一度お試しください。')
      }
    } catch (err) {
      setStatus('error')
      setMessage('ネットワークエラーが発生しました。')
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 border border-stone-100">
        <h1 className="text-2xl font-medium text-stone-800 mb-6 text-center">
          メルマガ解約手続き
        </h1>

        {status === 'success' ? (
          <div className="text-center">
            <p className="text-stone-600 mb-8 leading-relaxed">
              {message}<br />
              これまでのご購読、ありがとうございました。
            </p>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-stone-800 text-white rounded-full hover:bg-stone-700 transition-colors"
            >
              トップページに戻る
            </Link>
          </div>
        ) : (
          <>
            <p className="text-stone-600 mb-8 leading-relaxed text-center">
              以下のメールアドレスの配信を停止いたします。<br />
              よろしければ「解約する」ボタンを押してください。
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-stone-500 mb-2 ml-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="example@mail.com"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all text-stone-700"
                  disabled={status === 'loading'}
                />
              </div>

              {status === 'error' && (
                <p className="text-red-500 text-sm py-2 px-1">{message}</p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 bg-stone-100 text-stone-600 rounded-xl font-medium hover:bg-stone-200 transition-colors disabled:opacity-50"
              >
                {status === 'loading' ? '処理中...' : '解約する'}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-stone-100 text-center">
              <Link href="/" className="text-stone-400 text-sm hover:text-stone-600 transition-colors">
                やっぱりやめる
              </Link>
            </div>
          </>
        )}

        <div className="mt-12 text-center">
          <p className="text-xs text-stone-300 font-serif tracking-widest uppercase">
            ProReNata / Shirasaki Sera
          </p>
        </div>
      </div>
    </div>
  )
}
