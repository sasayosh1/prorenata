'use client'

import { useState } from 'react'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, hp_middle_name: honeypot }),
      })

      if (res.ok) {
        setStatus('success')
        setMessage('ありがとうございます。セラからのメッセージ（特典付き）をお送りしました🌙')
        setEmail('')
      } else {
        const data = await res.json()
        throw new Error(data.message || 'エラーが発生しました')
      }
    } catch (err: unknown) {
      setStatus('error')
      const errorMessage = err instanceof Error ? err.message : '登録に失敗しました。あとで試してみてくださいね。'
      setMessage(errorMessage)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-cyan-100 dark:border-cyan-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-cyan-100/50 dark:shadow-none">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-cyan-50 dark:bg-cyan-900/40 rounded-full mb-4">
            <svg className="w-6 h-6 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2 leading-tight">
            セラの「本音」を、<br />
            あなたのメールボックスへ。
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            スタンプのリリース案内や、ここだけの「贈り物」をお届けします。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <input
              type="email"
              required
              placeholder="メールアドレスを入力してください"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-cyan-500/20 dark:focus:ring-cyan-400/20 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300 outline-none"
            />
          </div>

          {/* ハニーポット（スパム対策）: ユーザーには見えません */}
          <div style={{ display: 'none' }} aria-hidden="true">
            <input
              type="text"
              name="hp_middle_name"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-black rounded-2xl shadow-lg shadow-cyan-600/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? '登録中...' : 'メルマガを購読する'}
          </button>
        </form>

        {status !== 'idle' && (
          <div className={`mt-6 p-4 rounded-xl text-sm font-bold text-center animate-in fade-in slide-in-from-top-2 duration-300 ${
            status === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          }`}>
            {message}
          </div>
        )}
        
        <p className="mt-6 text-center text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
          ご登録いただいたアドレスは、セラのメルマガ配信のみに使用します。<br />
          いつでも解除できますので、安心してくださいね。
        </p>
      </div>
    </div>
  )
}
