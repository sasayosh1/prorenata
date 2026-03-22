import { defineType, defineField } from 'sanity'
import { PlayIcon } from '@sanity/icons'

export default defineType({
  name: 'youtube',
  type: 'object',
  title: 'YouTube Video',
  icon: PlayIcon,
  fields: [
    defineField({
      name: 'url',
      type: 'url',
      title: 'YouTube video URL',
      description: '例: https://www.youtube.com/watch?v=xxxxxx',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      type: 'string',
      title: '動画タイトル',
      description: 'アクセシビリティ（alt属性）や管理用に使用します',
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: '動画の解説',
      description: '動画の下に表示される補足テキスト（任意）',
      rows: 3,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      url: 'url',
    },
    prepare(selection) {
      const { title, url } = selection
      return {
        title: title || 'YouTube Video',
        subtitle: url,
        media: PlayIcon,
      }
    },
  },
})
