import React from 'react'

export default function StandardDisclaimer() {
    return (
        <div className="mt-12 p-6 bg-gray-50 border-l-4 border-gray-300 rounded-r-lg text-sm text-gray-600 space-y-2">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-xl">⚠️</span> 免責事項と情報の取り扱いについて
            </h3>
            <p>
                当サイトの記事は、厚生労働省の資料や一般的な業界慣習、複数の求人データに基づき作成していますが、すべてのケースに当てはまることを保証するものではありません。
            </p>
            <p>
                医療行為、労務トラブル、税務、給与計算など個別の判断が必要な場合は、必ず医師・弁護士・税理士・社会保険労務士等の専門家にご相談ください。
            </p>
            <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                ※紹介しているサービスや求人条件は、記事公開/更新時点の情報です。最新の詳細は各公式サイトにて必ずご確認ください。
            </p>
        </div>
    )
}
