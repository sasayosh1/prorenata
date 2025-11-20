import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'affiliateEmbed',
  title: 'Affiliate Embed',
  type: 'object',
  fields: [
    defineField({
      name: 'provider',
      title: 'プロバイダ',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'linkKey',
      title: 'リンク識別子',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'label',
      title: '表示ラベル',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'html',
      title: '埋め込みHTML',
      type: 'text',
      rows: 4,
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'label',
      subtitle: 'provider',
    },
  },
})
