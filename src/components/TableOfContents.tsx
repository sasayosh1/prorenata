'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface TOCItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  className?: string
}

export default function TableOfContents({ className }: TableOfContentsProps) {
  const [toc, setToc] = useState<TOCItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
    const tocItems: TOCItem[] = headings.map((heading) => ({
      id: heading.id || heading.textContent?.toLowerCase().replace(/\s+/g, '-') || '',
      text: heading.textContent || '',
      level: parseInt(heading.tagName.charAt(1))
    }))

    // Add IDs to headings that don't have them
    headings.forEach((heading, index) => {
      if (!heading.id) {
        heading.id = tocItems[index].id
      }
    })

    setToc(tocItems)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-20% 0% -35% 0%',
        threshold: 0.1
      }
    )

    toc.forEach((item) => {
      const element = document.getElementById(item.id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [toc])

  if (toc.length === 0) return null

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  return (
    <div className={cn("medical-card p-4 sticky top-24", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-professional-900 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          目次
        </h3>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded hover:bg-professional-100 text-professional-600 transition-colors"
          aria-label={isCollapsed ? '目次を展開' : '目次を折りたたみ'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <nav className="space-y-1">
          {toc.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToHeading(item.id)}
              className={cn(
                "toc-link w-full text-left",
                {
                  'toc-link-active': activeId === item.id,
                  'pl-4': item.level === 2,
                  'pl-6': item.level === 3,
                  'pl-8': item.level >= 4,
                }
              )}
            >
              {item.text}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}