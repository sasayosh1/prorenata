import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'
import { portableTextComponents } from '@/components/PortableTextComponents'

type DisclaimerBlockProps = {
  title: string
  body?: PortableTextBlock[]
}

export default function DisclaimerBlock({ title, body }: DisclaimerBlockProps) {
  const hasBody = Array.isArray(body) && body.length > 0

  return (
    <div className="mt-12 p-6 bg-gray-50 border-l-4 border-gray-300 rounded-r-lg text-sm text-gray-600 space-y-2">
      <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
        <span className="text-xl">⚠️</span> {title}
      </h3>
      {hasBody ? (
        <div className="space-y-2">
          <PortableText value={body} components={portableTextComponents} />
        </div>
      ) : null}
    </div>
  )
}
