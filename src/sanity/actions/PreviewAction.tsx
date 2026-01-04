import { EyeOpenIcon } from '@sanity/icons'
import { DocumentActionComponent } from 'sanity'

const devUrl = 'http://localhost:3000'
const prodUrl = 'https://sasakiyoshimasa.com'

export const PreviewAction: DocumentActionComponent = (props) => {
  const { draft, published } = props
  const doc = draft || published

  if (!doc || doc._type !== 'post') {
    return null
  }

  const slug = doc.slug as { current?: string } | undefined
  if (!slug || !slug.current) {
    return null
  }

  const baseUrl = process.env.NODE_ENV === 'production' ? prodUrl : devUrl
  const url = `${baseUrl}/posts/${slug.current}`

  return {
    label: 'プレビュー',
    icon: EyeOpenIcon,
    onHandle: () => {
      window.open(url, '_blank')
    },
  }
}
