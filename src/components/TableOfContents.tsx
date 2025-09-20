'use client'

import { useEffect, useState } from 'react'

interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: Array<{
    _type: string
    style?: string
    children?: Array<{
      _type: string
      text?: string
      [key: string]: unknown
    }>
    [key: string]: unknown
  }>
  renderInline?: boolean
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [isOpen, setIsOpen] = useState<boolean>(false)

  useEffect(() => {
    // PortableTextのcontentからH2、H3を抽出
    const extractHeadings = (blocks: TableOfContentsProps['content']): TocItem[] => {
      const headings: TocItem[] = []

      blocks.forEach((block) => {
        if (block._type === 'block' && block.style &&
            (block.style === 'h2' || block.style === 'h3')) {
          const text = block.children
            ?.filter((child) => child._type === 'span')
            ?.map((child) => child.text)
            ?.join(' ') || ''

          if (text) {
            const id = text
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
              .trim()

            headings.push({
              id,
              text,
              level: block.style === 'h2' ? 2 : 3
            })
          }
        }
      })

      return headings
    }

    const headings = extractHeadings(content)
    setTocItems(headings)
  }, [content])

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  if (tocItems.length === 0) return null

  return (
    <div className="flex justify-center mb-6">
      <div className="w-full max-w-2xl border border-gray-300 rounded-lg p-4 bg-white">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-lg font-semibold text-black flex items-center w-full"
          style={{color: 'black !important'}}
        >
          もくじ
          <span className={`ml-auto transition-transform ${isOpen ? 'rotate-90' : ''}`}>
            ▶
          </span>
        </button>

        {isOpen && (
          <nav className="mt-3">
            <ul className="space-y-1">
              {tocItems.map((item, index) => (
                <li key={index} className={item.level === 3 ? 'ml-4' : ''}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToHeading(item.id)
                    }}
                    className={`
                      block px-3 py-2 rounded text-sm transition-colors duration-200 text-black hover:bg-gray-100
                      ${item.level === 2 ? 'font-medium' : 'font-normal'}
                    `}
                    style={{color: 'black !important'}}
                  >
                    {item.level === 3 && (
                      <span className="inline-block w-1.5 h-1.5 bg-black rounded-full mr-2"></span>
                    )}
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </div>
  )
}