'use client'

import { useEffect, useState } from 'react'

interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: any[]
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    // PortableTextのcontentからH2、H3を抽出
    const extractHeadings = (blocks: any[]): TocItem[] => {
      const headings: TocItem[] = []
      
      blocks.forEach((block) => {
        if (block._type === 'block' && block.style && 
            (block.style === 'h2' || block.style === 'h3')) {
          const text = block.children
            ?.filter((child: any) => child._type === 'span')
            ?.map((child: any) => child.text)
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

    // スクロールに応じてアクティブな見出しを更新
    const handleScroll = () => {
      const headingElements = headings.map(heading => 
        document.getElementById(heading.id)
      ).filter(Boolean)

      if (headingElements.length === 0) return

      const scrollY = window.scrollY + 100 // オフセット

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i]
        if (element && element.offsetTop <= scrollY) {
          setActiveId(headings[i].id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // 初期実行

    return () => window.removeEventListener('scroll', handleScroll)
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
    <div className="border border-gray-300 rounded-lg p-4 mb-6 bg-gray-50">
      <h3 className="text-lg font-semibold mb-3 text-black flex items-center">
        <span className="inline-block w-2 h-2 bg-black rounded-full mr-2"></span>
        もくじ
      </h3>
      <nav>
        <ul className="space-y-2">
          {tocItems.map((item, index) => (
            <li key={index} className={item.level === 3 ? 'ml-4' : ''}>
              <button
                onClick={() => scrollToHeading(item.id)}
                className={`
                  text-left w-full px-3 py-2 rounded transition-colors duration-200 text-sm
                  ${activeId === item.id 
                    ? 'bg-cyan-100 text-cyan-800 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                  ${item.level === 2 ? 'font-medium' : 'font-normal'}
                `}
              >
                {item.level === 2 && (
                  <span className="inline-block w-2 h-2 bg-gray-600 rounded-full mr-2"></span>
                )}
                {item.level === 3 && (
                  <span className="inline-block mr-2 text-gray-600">▶</span>
                )}
                {item.text}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}