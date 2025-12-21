"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getClientId } from "@/lib/clientId";
import { Id } from "../../convex/_generated/dataModel";

export default function ConvexMedicalQuiz() {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
        return (
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900">メディカルクイズ</h2>
                <p className="mt-3 text-gray-600 leading-relaxed">
                    ただいまクイズ機能の準備中です。少し時間をおいてから再度お試しください。
                </p>
                <Link
                    href="/"
                    className="inline-flex mt-6 items-center justify-center rounded-full bg-cyan-600 px-6 py-3 text-white font-semibold hover:bg-cyan-700 transition-colors"
                >
                    ホームへ戻る
                </Link>
            </div>
        );
    }

    return <ConvexMedicalQuizInner />;
}

function ConvexMedicalQuizInner() {
    const [clientId, setClientId] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<Id<"quizSessions"> | null>(null);
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [result, setResult] = useState<{ isCorrect: boolean; correctIndex: number; explanation?: string } | null>(null);
    const [activeQuestion, setActiveQuestion] = useState<{ qid: string; prompt: string; choices: string[]; category?: string; difficulty?: string } | null>(null);

    const upsertSession = useMutation(api.quiz.upsertSession);
    const prepareNextQuestion = useMutation(api.quiz.prepareNextQuestion);
    const submitAnswer = useMutation(api.quiz.submitAnswer);

    const stats = useQuery(api.quiz.getMyStats, clientId ? { clientId } : "skip");
    const question = useQuery(
        api.quiz.nextQuestion,
        clientId && sessionId && !result ? { clientId, sessionId } : "skip"
    );

    useEffect(() => {
        const id = getClientId();
        setClientId(id);
        upsertSession({ clientId: id }).then(setSessionId);
    }, [upsertSession]); // Run once on mount

    // Update activeQuestion when a new question arrives via query
    useEffect(() => {
        if (question && question.status === "ok" && question.qid && question.prompt && Array.isArray(question.choices)) {
            setActiveQuestion({
                qid: question.qid,
                prompt: question.prompt,
                choices: question.choices,
                category: question.category,
                difficulty: question.difficulty
            });
        }
    }, [question]);

    const handleSelect = async (index: number) => {
        if (!clientId || !sessionId || !activeQuestion || result !== null) return;

        setSelectedIdx(index);

        const res = await submitAnswer({
            clientId,
            sessionId,
            qid: activeQuestion.qid,
            selectedIndex: index,
        });
        setResult({
            isCorrect: res.isCorrect,
            correctIndex: res.correctIndex,
            explanation: res.explanation
        });
    };

    const handleNext = async () => {
        if (!sessionId) return;
        setSelectedIdx(null);
        setResult(null);
        setActiveQuestion(null);
        // 次の問題を明示的に準備する
        await prepareNextQuestion({ sessionId });
    };

    if (!clientId || !sessionId) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    const displayQuestion = result ? activeQuestion : (question?.status === "ok" ? question : null);

    return (
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
            {/* Header / Stats */}
            <div className="bg-gradient-to-r from-cyan-600 to-blue-700 p-6 text-white text-center">
                <h2 className="text-2xl font-bold mb-2">実力テスト</h2>
                <div className="flex justify-center gap-6 text-sm">
                    <div className="bg-white/20 px-3 py-1 rounded-full">
                        正解数: <span className="font-bold">{stats?.correct ?? 0}</span>
                    </div>
                    <div className="bg-white/20 px-3 py-1 rounded-full">
                        連勝: <span className="font-bold">{stats?.streak ?? 0}</span>
                    </div>
                    {stats?.dailyCount !== undefined && (
                        <div className="bg-white/20 px-3 py-1 rounded-full">
                            今日: <span className="font-bold">{stats.dailyCount}/10</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Question Area */}
            <div className="p-8">
                {question?.status === "limit_reached" ? (
                    <div className="text-center py-12 space-y-6">
                        <div className="text-5xl mb-4">🏠</div>
                        <h3 className="text-2xl font-bold text-gray-900">本日の学習制限（10問）に達しました</h3>
                        <p className="text-gray-600 max-w-sm mx-auto leading-relaxed">
                            お疲れ様でした！毎日の積み重ねが大切です。
                            明日また新しい問題にチャレンジしてください。
                        </p>
                        <div className="pt-6">
                            <Link
                                href="/"
                                className="inline-block px-8 py-3 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-700 transition-all shadow-md"
                            >
                                ホームに戻る
                            </Link>
                        </div>
                    </div>
                ) : !displayQuestion && !result ? (
                    <div className="text-center py-12 text-gray-500">
                        問題を読み込んでいます...
                    </div>
                ) : (
                    <>
                        {displayQuestion && (
                            <div className="mb-8">
                                <div className="flex gap-2 mb-4">
                                    <span className="bg-cyan-100 text-cyan-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                        {displayQuestion.category ?? "全般"}
                                    </span>
                                    <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                        {displayQuestion.difficulty ?? "普通"}
                                    </span>
                                </div>
                                <h3 className="text-xl font-medium text-gray-900 leading-relaxed">
                                    {displayQuestion.prompt}
                                </h3>
                            </div>
                        )}

                        {/* Choices */}
                        <div className="space-y-3">
                            {(displayQuestion?.choices || []).map((choice, idx) => {
                                const isSelected = selectedIdx === idx;
                                const isCorrect = result?.correctIndex === idx;
                                const isWrong = result && isSelected && !result.isCorrect;

                                let bgColor = "hover:bg-gray-50 border-gray-200 text-gray-700";
                                if (result) {
                                    if (isCorrect) bgColor = "bg-green-100 border-green-500 text-green-800 ring-2 ring-green-200";
                                    else if (isWrong) bgColor = "bg-red-100 border-red-500 text-red-800";
                                    else bgColor = "bg-gray-50 border-gray-200 opacity-50";
                                } else if (isSelected) {
                                    bgColor = "bg-cyan-50 border-cyan-500 text-cyan-700 ring-2 ring-cyan-100";
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelect(idx)}
                                        disabled={result !== null}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${bgColor} font-medium flex items-center justify-between group`}
                                    >
                                        <span>{choice}</span>
                                        {result && isCorrect && (
                                            <span className="text-green-600 font-bold text-xl">✓</span>
                                        )}
                                        {result && isWrong && (
                                            <span className="text-red-600 font-bold text-xl">✕</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Result Feedback & Next */}
                        {result && (
                            <div className="mt-8 animate-fade-in space-y-6">
                                <div className={`p-6 rounded-2xl flex items-start gap-4 ${result.isCorrect ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                                    <span className="text-4xl mt-1">
                                        {result.isCorrect ? '🎉' : '💡'}
                                    </span>
                                    <div>
                                        <p className={`text-xl font-bold ${result.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                                            {result.isCorrect ? '正解です！' : '残念、不正解です。'}
                                        </p>
                                        <p className={`mt-2 ${result.isCorrect ? 'text-green-700' : 'text-red-700'} font-medium`}>
                                            {result.isCorrect
                                                ? "その調子で次も頑張りましょう！"
                                                : `正解は「${activeQuestion?.choices[result.correctIndex]}」でした。`}
                                        </p>
                                    </div>
                                </div>

                                {result.explanation && (
                                    <div className="bg-cyan-50 border border-cyan-100 p-6 rounded-2xl">
                                        <h4 className="text-cyan-900 font-bold mb-2 flex items-center gap-2">
                                            <span className="bg-cyan-600 text-white text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider">Check</span>
                                            学びのポイント
                                        </h4>
                                        <p className="text-cyan-800 text-sm leading-relaxed">
                                            {result.explanation}
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={handleNext}
                                    className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-[0.98]"
                                >
                                    次の問題へ進む →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
