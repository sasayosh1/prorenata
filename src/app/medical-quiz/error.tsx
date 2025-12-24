"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function MedicalQuizError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("medical-quiz error boundary:", error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">メディカルクイズ</h1>
        <p className="mt-3 text-gray-600 leading-relaxed">
          ただいまクイズ画面でエラーが発生しました。通信状態を確認して再度お試しください。
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            再試行
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-gray-100 px-6 py-3 text-gray-800 font-semibold hover:bg-gray-200 transition-colors"
          >
            ホームへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}

