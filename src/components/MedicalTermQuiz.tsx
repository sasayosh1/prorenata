'use client'

import { useState, useEffect } from 'react'
import { medicalTerms, categories, type MedicalTerm } from '@/data/medical-terms'

interface QuizStats {
  totalAnswered: number
  correctAnswers: number
  streak: number
  bestStreak: number
}

export default function MedicalTermQuiz() {
  const [currentTerm, setCurrentTerm] = useState<MedicalTerm | null>(null)
  const [choices, setChoices] = useState<string[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [stats, setStats] = useState<QuizStats>({
    totalAnswered: 0,
    correctAnswers: 0,
    streak: 0,
    bestStreak: 0,
  })

  // LocalStorageから統計を読み込む
  useEffect(() => {
    const savedStats = localStorage.getItem('medicalTermQuizStats')
    if (savedStats) {
      setStats(JSON.parse(savedStats))
    }
    loadNewQuestion()
  }, [])

  // 統計をLocalStorageに保存
  useEffect(() => {
    if (stats.totalAnswered > 0) {
      localStorage.setItem('medicalTermQuizStats', JSON.stringify(stats))
    }
  }, [stats])

  // 新しい問題を読み込む
  const loadNewQuestion = () => {
    // ランダムに用語を選択
    const randomIndex = Math.floor(Math.random() * medicalTerms.length)
    const term = medicalTerms[randomIndex]

    // 選択肢を作成（正解 + 誤答2つ）
    const shuffledChoices = [term.meaning, ...term.distractors].sort(() => Math.random() - 0.5)

    setCurrentTerm(term)
    setChoices(shuffledChoices)
    setSelectedAnswer(null)
    setIsCorrect(null)
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
      bestStreak: Math.max(
        prevStats.bestStreak,
        correct ? prevStats.streak + 1 : 0
      ),
    }))
  }

  // 次の問題へ
  const handleNext = () => {
    loadNewQuestion()
  }

  if (!currentTerm) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-600">問題を読み込んでいます...</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          医療用語クイズ
        </h2>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>正解率: {stats.totalAnswered > 0 ? Math.round((stats.correctAnswers / stats.totalAnswered) * 100) : 0}%</span>
          <span>連続正解: {stats.streak}回</span>
          <span>最高記録: {stats.bestStreak}回</span>
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
            // 回答前
            buttonClass += 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
          } else if (isSelected && isCorrect) {
            // 選択した答えが正解
            buttonClass += 'border-green-500 bg-green-50 text-green-900'
          } else if (isSelected && !isCorrect) {
            // 選択した答えが不正解
            buttonClass += 'border-red-500 bg-red-50 text-red-900'
          } else if (isCorrectChoice) {
            // 正解の選択肢を表示
            buttonClass += 'border-green-500 bg-green-50 text-green-900'
          } else {
            // その他の選択肢
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
          次の問題へ
        </button>
      )}
    </div>
  )
}
