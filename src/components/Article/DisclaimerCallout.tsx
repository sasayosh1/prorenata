import React from 'react'
import type { PortableTextBlock } from '@portabletext/types'

type DisclaimerCalloutProps = {
  blocks?: PortableTextBlock[]
  className?: string
}

function extractPlainText(value?: PortableTextBlock) {
  if (!value || !Array.isArray(value.children)) return ''
  return value.children
    .map((child) => (typeof (child as { text?: string }).text === 'string' ? (child as { text?: string }).text : ''))
    .join('')
    .trim()
}

export default function DisclaimerCallout({ blocks, className = '' }: DisclaimerCalloutProps) {
  const safeBlocks = Array.isArray(blocks) ? blocks : []
  if (safeBlocks.length === 0) return null

  const firstText = extractPlainText(safeBlocks[0])
  const hasTitle = firstText.startsWith('免責事項')
  const titleText = hasTitle ? firstText : '免責事項と情報の取り扱いについて'
  const contentBlocks = hasTitle ? safeBlocks.slice(1) : safeBlocks

  return (
    <div className={`mt-12 p-6 bg-gray-50 border-l-4 border-gray-300 rounded-r-lg text-sm text-gray-600 space-y-2 ${className}`.trim()}>
      <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
        <span className="text-xl">⚠️</span> {titleText}
      </h3>
      {contentBlocks.map((block, index) => {
        const text = extractPlainText(block)
        if (!text) return null
        if (text.startsWith('※')) {
          return (
            <p key={block._key || `disclaimer-${index}`} className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
              {text}
            </p>
          )
        }
        return (
          <p key={block._key || `disclaimer-${index}`}>
            {text}
          </p>
        )
      })}
    </div>
  )
}
