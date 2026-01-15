import { defineType, defineArrayMember } from 'sanity'

export const blockContent = defineType({
  title: 'Block Content',
  name: 'blockContent',
  type: 'array',
  of: [
    defineArrayMember({
      title: 'Block',
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H1', value: 'h1' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'H4', value: 'h4' },
        { title: 'Quote', value: 'blockquote' },
        { title: 'Callout', value: 'callout' },
      ],
      lists: [{ title: 'Bullet', value: 'bullet' }],
      marks: {
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Emphasis', value: 'em' },
        ],
        annotations: [
          {
            title: 'URL',
            name: 'link',
            type: 'object',
            fields: [
              {
                title: 'URL',
                name: 'href',
                type: 'url',
              },
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      options: { hotspot: true },
    }),
    defineArrayMember({
      title: 'Affiliate Embed',
      name: 'affiliateEmbed',
      type: 'object',
      fields: [
        {
          title: 'プロバイダ',
          name: 'provider',
          type: 'string',
          readOnly: true,
        },
        {
          title: 'リンク識別子',
          name: 'linkKey',
          type: 'string',
          readOnly: true,
        },
        {
          title: '表示ラベル',
          name: 'label',
          type: 'string',
          readOnly: true,
        },
        {
          title: '埋め込みHTML',
          name: 'html',
          type: 'text',
          rows: 4,
          readOnly: true,
        },
      ],
      preview: {
        select: {
          title: 'label',
          subtitle: 'provider',
        },
      },
    }),
  ],
})
