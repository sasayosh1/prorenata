"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getClientId } from "@/lib/clientId";
import { Id } from "../../../convex/_generated/dataModel";

export default function MedicalQuizPage() {
    const [clientId, setClientId] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<Id<"quizSessions"> | null>(null);
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [result, setResult] = useState<{ isCorrect: boolean; correctIndex: number } | null>(null);

    const upsertSession = useMutation(api.quiz.upsertSession);
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
    }, [upsertSession]);

    const handleSelect = async (index: number) => {
        if (!clientId || !sessionId || !question || result !== null) return;
        if (!question.qid) return;
        setSelectedIdx(index);

        const res = await submitAnswer({
            clientId,
            sessionId,
            qid: question.qid,
            selectedIndex: index,
        });
        setResult({
            isCorrect: res.isCorrect,
            correctIndex: res.correctIndex,
        });
    };

    const handleNext = () => {
        setSelectedIdx(null);
        setResult(null);
    };

    if (!clientId || !sessionId) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                {/* Header / Stats */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center">
                    <h1 className="text-2xl font-bold mb-2">メディカルクイズ</h1>
                    <p className="text-blue-100 text-sm">看護助手のための実践知識テスト</p>

                    <div className="mt-4 flex justify-center gap-6 text-sm">
                        <div className="bg-white/20 px-3 py-1 rounded-full">
                            正解数: <span className="font-bold">{stats?.correct ?? 0}</span>
                        </div>
                        <div className="bg-white/20 px-3 py-1 rounded-full">
                            現在の連勝: <span className="font-bold">{stats?.streak ?? 0}</span>
                        </div>
                    </div>
                </div>

                {/* Question Area */}
                <div className="p-8">
                    {!question && !result ? (
                        <div className="text-center py-12 text-gray-500">
                            問題を読み込んでいます...
                        </div>
                    ) : (
                        <>
                            {question && (
                                <div className="mb-8">
                                    <div className="flex gap-2 mb-4">
                                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                            {question.category ?? "全般"}
                                        </span>
                                        <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                            {question.difficulty ?? "普通"}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-medium text-gray-900 leading-relaxed">
                                        {question.prompt}
                                    </h2>
                                </div>
                            )}

                            {/* Choices */}
                            <div className="space-y-3">
                                {(question?.choices || []).map((choice, idx) => {
                                    const isSelected = selectedIdx === idx;
                                    const isCorrect = result?.correctIndex === idx;
                                    const isWrong = result && isSelected && !result.isCorrect;

                                    let bgColor = "hover:bg-gray-50 border-gray-200 text-gray-700";
                                    if (result) {
                                        if (isCorrect) bgColor = "bg-green-100 border-green-500 text-green-800 ring-2 ring-green-200";
                                        else if (isWrong) bgColor = "bg-red-100 border-red-500 text-red-800";
                                        else bgColor = "bg-gray-50 border-gray-200 opacity-50";
                                    } else if (isSelected) {
                                        bgColor = "bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-100";
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
                                                <span className="text-green-600">✓</span>
                                            )}
                                            {result && isWrong && (
                                                <span className="text-red-600">✕</span>
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
                                                    : `正解は「${question?.choices?.[result.correctIndex] ?? "（不明）"}」でした。`}
                                            </p>
                                        </div>
                                    </div>

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

            {/* Footer info */}
            <p className="text-center mt-8 text-gray-500 text-xs">
                すべての問題はLLMを使用せず、専門的なルールに基づき提供されています。<br />
                履歴はブラウザごとに保存されます。
            </p>
        </div>
    );
}
