import React from 'react'

export default function PRDisclosure() {
    return (
        <div className="bg-gray-50 text-xs text-gray-500 py-2 px-4 mb-6 rounded flex items-center gap-2">
            <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-bold">PR</span>
            <span>当記事はアフィリエイト広告を利用しています。選定基準については<a href="/about" className="underline hover:text-gray-800">運営方針</a>をご覧ください。</span>
        </div>
    )
}
