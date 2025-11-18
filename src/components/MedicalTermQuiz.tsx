'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { medicalTerms, categories, type MedicalTerm } from '@/data/medical-terms'

interface QuizStats {
  totalAnswered: number
  correctAnswers: number
  streak: number
  bestStreak: number
}

interface DailyProgress {
  date: string
  questionsAnswered: number
  correctAnswers: number
  playerName: string | null
}

export default function MedicalTermQuiz() {
  const [currentTerm, setCurrentTerm] = useState<MedicalTerm | null>(null)
  const [choices, setChoices] = useState<string[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [playerName, setPlayerName] = useState<string>('')
  const [hasEnteredName, setHasEnteredName] = useState(false)
  const [showNameInput, setShowNameInput] = useState(false)
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>({
    date: '',
    questionsAnswered: 0,
    correctAnswers: 0,
    playerName: null,
  })
  const [currentSessionCorrect, setCurrentSessionCorrect] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [stats, setStats] = useState<QuizStats>({
    totalAnswered: 0,
    correctAnswers: 0,
    streak: 0,
    bestStreak: 0,
  })
  const [askedTermIds, setAskedTermIds] = useState<string[]>([])

  const DAILY_LIMIT = 10

  // LocalStorageから進捗を読み込む
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const savedProgress = localStorage.getItem('medicalTermDailyProgress')
    const savedStats = localStorage.getItem('medicalTermQuizStats')
    const savedName = localStorage.getItem('medicalTermPlayerName')

    if (savedStats) {
      setStats(JSON.parse(savedStats))
    }

    if (savedProgress) {
      const progress: DailyProgress = JSON.parse(savedProgress)
      if (progress.date === today) {
        setDailyProgress(progress)
        if (progress.playerName) {
          setPlayerName(progress.playerName)
          setHasEnteredName(true)
        }
      } else {
        // 新しい日なのでリセット
        const newProgress = {
          date: today,
          questionsAnswered: 0,
          correctAnswers: 0,
          playerName: progress.playerName,
        }
        setDailyProgress(newProgress)
        setAskedTermIds([]) // 出題済み問題もリセット
        localStorage.setItem('medicalTermDailyProgress', JSON.stringify(newProgress))
        if (progress.playerName) {
          setPlayerName(progress.playerName)
          setHasEnteredName(true)
        }
      }
    } else {
      setDailyProgress({
        date: today,
        questionsAnswered: 0,
        correctAnswers: 0,
        playerName: null,
      })
    }

    if (savedName && !savedProgress) {
      setPlayerName(savedName)
      setHasEnteredName(true)
    }

    // 5問完了していない場合のみ問題を読み込む
    if (dailyProgress.questionsAnswered < DAILY_LIMIT && hasEnteredName) {
      loadNewQuestion()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 統計をLocalStorageに保存
  useEffect(() => {
    if (stats.totalAnswered > 0) {
      localStorage.setItem('medicalTermQuizStats', JSON.stringify(stats))
    }
  }, [stats])

  // 進捗をLocalStorageに保存
  useEffect(() => {
    if (dailyProgress.date) {
      localStorage.setItem('medicalTermDailyProgress', JSON.stringify(dailyProgress))
    }
  }, [dailyProgress])

  // 新しい問題を読み込む
  const loadNewQuestion = () => {
    // すでに出題された問題を除外
    const availableTerms = medicalTerms.filter(term => !askedTermIds.includes(term.id))

    // 利用可能な問題がない場合（念のため）
    if (availableTerms.length === 0) {
      return
    }

    const randomIndex = Math.floor(Math.random() * availableTerms.length)
    const term = availableTerms[randomIndex]
    const shuffledChoices = [term.meaning, ...term.distractors].sort(() => Math.random() - 0.5)

    setCurrentTerm(term)
    setChoices(shuffledChoices)
    setSelectedAnswer(null)
    setIsCorrect(null)

    // 出題済みリストに追加
    setAskedTermIds(prev => [...prev, term.id])
  }

  // 名前入力の処理
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (playerName.trim()) {
      setHasEnteredName(true)
      setShowNameInput(false)
      localStorage.setItem('medicalTermPlayerName', playerName.trim())
      setDailyProgress(prev => ({ ...prev, playerName: playerName.trim() }))
      // 5問完了していない場合のみ問題を読み込む
      if (dailyProgress.questionsAnswered < DAILY_LIMIT) {
        setAskedTermIds([]) // 新しいセッション開始時に出題済み問題をリセット
        setCurrentSessionCorrect(0) // セッション正解数もリセット
        loadNewQuestion()
      }
    }
  }

  // スコアをAPIに送信
  const submitScore = async () => {
    if (!hasEnteredName || !playerName.trim()) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/quiz/submit-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: playerName.trim(),
          score: currentSessionCorrect,
          correctAnswers: currentSessionCorrect,
          totalQuestions: DAILY_LIMIT,
        }),
      })

      if (!response.ok) {
        throw new Error('スコアの送信に失敗しました')
      }
    } catch (error) {
      console.error('Score submission error:', error)
      setSubmitError('スコアの送信に失敗しました。ネットワーク接続を確認してください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 回答を処理
  const handleAnswer = (answer: string) => {
    if (selectedAnswer !== null || !currentTerm) return

    setSelectedAnswer(answer)
    const correct = answer === currentTerm.meaning
    setIsCorrect(correct)

    // 統計を更新
    setStats(prevStats => ({
      totalAnswered: prevStats.totalAnswered + 1,
      correctAnswers: prevStats.correctAnswers + (correct ? 1 : 0),
      streak: correct ? prevStats.streak + 1 : 0,
      bestStreak: Math.max(prevStats.bestStreak, correct ? prevStats.streak + 1 : 0),
    }))

    // セッション正解数を更新
    if (correct) {
      setCurrentSessionCorrect(prev => prev + 1)
    }

    // 日次進捗を更新
    setDailyProgress(prev => ({
      ...prev,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: prev.correctAnswers + (correct ? 1 : 0),
    }))
  }

  // 次の問題へ
  const handleNext = () => {
    // 5問目の場合はスコアを送信
    if (dailyProgress.questionsAnswered >= DAILY_LIMIT) {
      submitScore()
    } else {
      loadNewQuestion()
    }
  }

  // 今日のクイズが完了しているか
  const isDailyLimitReached = dailyProgress.questionsAnswered >= DAILY_LIMIT

  // 名前入力画面
  if (!hasEnteredName || showNameInput) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            メディカルクイズへようこそ
          </h2>
          <p className="text-gray-600 mb-4">
            ランキングに参加するために、お名前を入力してください。
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              <strong>プライバシーについて：</strong>
              入力された名前はランキング表示のみに使用し、それ以外の目的では使用しません。
            </p>
          </div>
        </div>

        <form onSubmit={handleNameSubmit}>
          <div className="mb-6">
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
              お名前（ニックネーム可）
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例: 山田太郎"
              required
              maxLength={20}
              autoFocus
            />
            <p className="mt-2 text-sm text-gray-500">
              ※ 20文字以内で入力してください
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={!playerName.trim()}
          >
            クイズを始める
          </button>
        </form>
      </div>
    )
  }

  // クイズ完了画面
  if (isDailyLimitReached && !isSubmitting) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <div className="text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              お疲れさまでした！
            </h2>
            <p className="text-gray-600 mb-6">
              今日のクイズは完了しました
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">正解数</p>
                <p className="text-3xl font-bold text-blue-600">
                  {dailyProgress.correctAnswers}/{DAILY_LIMIT}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">正解率</p>
                <p className="text-3xl font-bold text-cyan-600">
                  {Math.round((dailyProgress.correctAnswers / DAILY_LIMIT) * 100)}%
                </p>
              </div>
            </div>
          </div>

          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-900 text-sm">{submitError}</p>
              <button
                onClick={submitScore}
                className="mt-2 text-red-700 underline text-sm hover:text-red-900"
              >
                再送信
              </button>
            </div>
          )}

          <div className="space-y-4 text-center">
            <p className="text-gray-700">スコアはランキングに登録されました</p>
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4 mt-4">
              <p className="text-lg font-semibold text-blue-900">また明日、がんばりましょう！</p>
              <p className="text-sm text-blue-700 mt-2">毎日コツコツ続けることが、成長への近道です</p>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <Link
              href="/quiz/rankings"
              className="flex-1 py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-center"
            >
              ランキングを見る
            </Link>
            <Link
              href="/"
              className="flex-1 py-3 px-6 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors text-center"
            >
              ホームへ戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 5問完了後に問題を読み込まない
  if (!currentTerm && !isDailyLimitReached) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-600">問題を読み込んでいます...</p>
      </div>
    )
  }

  // 5問完了している場合は、問題を表示せず完了画面のみ表示
  if (!currentTerm && isDailyLimitReached) {
    // 完了画面は上の条件で表示されるので、ここでは何も返さない
    return null
  }

  // currentTermがnullの場合は何も表示しない（TypeScript対策）
  if (!currentTerm) {
    return null
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            メディカルクイズ
          </h2>
          <div className="text-right">
            <p className="text-sm text-gray-600">今日の進捗</p>
            <p className="text-lg font-bold text-blue-600">
              {dailyProgress.questionsAnswered}/{DAILY_LIMIT}問
            </p>
          </div>
        </div>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>プレイヤー: {playerName}</span>
          <span>|</span>
          <span>今日の正解: {dailyProgress.correctAnswers}問</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 mb-4">
          {categories[currentTerm.category]}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {currentTerm.term}
        </h3>
        <p className="text-gray-600">この用語の意味は？</p>
      </div>

      <div className="space-y-3 mb-6">
        {choices.map((choice, index) => {
          const isSelected = selectedAnswer === choice
          const isCorrectChoice = choice === currentTerm.meaning

          let buttonClass = 'w-full p-4 text-left border-2 rounded-lg transition-colors '

          if (selectedAnswer === null) {
            buttonClass += 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
          } else if (isSelected && isCorrect) {
            buttonClass += 'border-green-500 bg-green-50 text-green-900'
          } else if (isSelected && !isCorrect) {
            buttonClass += 'border-red-500 bg-red-50 text-red-900'
          } else if (isCorrectChoice) {
            buttonClass += 'border-green-500 bg-green-50 text-green-900'
          } else {
            buttonClass += 'border-gray-200 text-gray-400'
          }

          return (
            <button
              key={index}
              onClick={() => handleAnswer(choice)}
              disabled={selectedAnswer !== null}
              className={buttonClass}
            >
              {choice}
            </button>
          )
        })}
      </div>

      {selectedAnswer !== null && (
        <div className="mb-6">
          {isCorrect ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-900 font-semibold">正解です！</p>
            </div>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-900 font-semibold">不正解です</p>
              <p className="text-red-800 mt-2">正解: {currentTerm.meaning}</p>
            </div>
          )}
        </div>
      )}

      {selectedAnswer !== null && (
        <button
          onClick={handleNext}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          {dailyProgress.questionsAnswered >= DAILY_LIMIT ? '結果を見る' : '次の問題へ'}
        </button>
      )}
    </div>
  )
}
