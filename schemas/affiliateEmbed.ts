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
    }),
    defineField({
      name: 'linkKey',
      title: 'リンク識別子',
      type: 'string',
    }),
    defineField({
      name: 'label',
      title: '表示ラベル',
      type: 'string',
    }),
    defineField({
      name: 'html',
      title: '埋め込みHTML',
      type: 'text',
      rows: 10,
    }),
  ],
  preview: {
    select: {
      title: 'label',
      subtitle: 'provider',
    },
  },
})
