'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Share2, Twitter, Link as LinkIcon, Check } from 'lucide-react'

interface ShareButtonsProps {
  url: string
  title: string
  excerpt?: string
}

export default function ShareButtons({ url, title, excerpt }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleTwitterShare = () => {
    const text = `${title}${excerpt ? ` - ${excerpt}` : ''}`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=ProReNata,看護助手`
    window.open(twitterUrl, '_blank', 'width=600,height=400')
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="outline" className="flex items-center gap-2">
        <Share2 className="w-3 h-3" />
        シェア
      </Badge>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleTwitterShare}
        className="flex items-center gap-2"
      >
        <Twitter className="w-4 h-4" />
        Twitter
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="flex items-center gap-2"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-clean-600" />
            コピー済み
          </>
        ) : (
          <>
            <LinkIcon className="w-4 h-4" />
            リンクコピー
          </>
        )}
      </Button>
    </div>
  )
}