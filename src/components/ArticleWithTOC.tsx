'use client'

import { PortableText } from '@portabletext/react'
import { portableTextComponents } from './PortableTextComponents'
import TableOfContents from './TableOfContents'

interface ArticleWithTOCProps {
  content: Array<{
    _type: string
    style?: string
    [key: string]: unknown
  }>
}

export default function ArticleWithTOC({ content }: ArticleWithTOCProps) {
  // 最初のH2を見つける
  const firstH2Index = content.findIndex(
    block => block._type === 'block' && block.style === 'h2'
  )

  // 導入部（最初のH2より前）と本文部（最初のH2以降）に分割
  const introContent = firstH2Index > 0 ? content.slice(0, firstH2Index) : []
  const mainContent = firstH2Index >= 0 ? content.slice(firstH2Index) : content

  return (
    <div className="text-gray-900 [&]:!text-gray-900 [&>*]:!text-gray-900 [&_*]:!text-gray-900" style={{color: '#111827 !important'}}>
      {/* 導入部 */}
      {introContent.length > 0 && (
        <div className="text-gray-900 [&]:!text-gray-900 [&>*]:!text-gray-900 [&_*]:!text-gray-900" style={{color: '#111827 !important'}}>
          <PortableText
            value={introContent}
            components={portableTextComponents}
          />
        </div>
      )}

      {/* 目次（最初のH2がある場合のみ表示） */}
      {firstH2Index >= 0 && <TableOfContents content={content} />}

      {/* 本文部 */}
      <div className="text-gray-900 [&]:!text-gray-900 [&>*]:!text-gray-900 [&_*]:!text-gray-900" style={{color: '#111827 !important'}}>
        <PortableText
          value={mainContent}
          components={portableTextComponents}
        />
      </div>
    </div>
  )
}