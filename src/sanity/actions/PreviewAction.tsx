import {EyeOpenIcon} from '@sanity/icons'
import {DocumentActionComponent} from '@sanity/types'

export const PreviewAction: DocumentActionComponent = (props) => {
  const {draft, published} = props
  const doc = draft || published

  if (!doc || doc._type !== 'post') {
    return null
  }

  const slug = doc.slug?.current

  const handlePreview = () => {
    if (!slug) {
      alert('記事のスラッグが設定されていません。先にタイトルとスラッグを保存してください。')
      return
    }

    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://prorenata.jp'

    const previewUrl = `${baseUrl}/posts/${slug}`
    window.open(previewUrl, '_blank')
  }

  return {
    label: 'プレビュー',
    icon: EyeOpenIcon,
    onHandle: handlePreview,
    tone: 'primary'
  }
}