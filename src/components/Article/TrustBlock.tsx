import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'
import { portableTextComponents } from '@/components/PortableTextComponents'

type TrustBlockProps = {
  title: string
  body?: PortableTextBlock[]
}

export default function TrustBlock({ title, body }: TrustBlockProps) {
  const hasBody = Array.isArray(body) && body.length > 0

  return (
    <div className="mt-12 p-6 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 space-y-2">
      <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
        <span className="text-lg">🔎</span> {title}
      </h3>
      {hasBody ? (
        <div className="space-y-2">
          <PortableText value={body} components={portableTextComponents} />
        </div>
      ) : null}
    </div>
  )
}
