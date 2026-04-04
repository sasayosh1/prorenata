import { defineType, defineField } from 'sanity'
import blockContent from './blockContent'

export default defineType({
  name: 'newsletter',
  title: 'Newsletter',
  type: 'document',
  fields: [
    defineField({
      name: 'subject',
      title: 'メール件名',
      type: 'string',
      validation: rule => rule.required().max(100),
      description: '例: 現役看護助手が抱える人間関係の悩みと対処法',
    }),

    defineField({
      name: 'emailNumber',
      title: 'メール号',
      type: 'number',
      validation: rule => rule.required().min(1),
      description: '配信順序（1, 2, 3...）',
    }),

    defineField({
      name: 'theme',
      title: 'テーマ',
      type: 'string',
      description: '例: 給与・待遇, 人間関係, キャリア, メンタルケア',
    }),

    defineField({
      name: 'body',
      title: 'メール本文',
      type: 'array',
      of: blockContent.of,
      description: 'PortableText形式（記事と同じエディタで編集可）',
    }),

    defineField({
      name: 'scheduledAt',
      title: '配信予定日時',
      type: 'datetime',
      description: 'GitHub Actions が参照して自動配信',
    }),

    defineField({
      name: 'sent',
      title: '配信済みフラグ',
      type: 'boolean',
      initialValue: false,
    }),

    defineField({
      name: 'sentAt',
      title: '配信完了日時',
      type: 'datetime',
      readOnly: true,
    }),

    defineField({
      name: 'notes',
      title: '備考',
      type: 'text',
      rows: 3,
      description: '内部メモ（配信者向け）',
    }),
  ],

  preview: {
    select: {
      title: 'subject',
      subtitle: 'theme',
    },
  },
})
