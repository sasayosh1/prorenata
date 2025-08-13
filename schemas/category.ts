import { defineField, defineType } from 'sanity'

export const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'parentCategory',
      title: 'Parent Category',
      type: 'reference',
      to: { type: 'category' },
      description: '親カテゴリ（階層構造用）',
    }),
    defineField({
      name: 'level',
      title: 'Category Level',
      type: 'number',
      description: 'カテゴリレベル（1=メイン, 2=サブ, 3=詳細）',
      validation: (Rule) => Rule.min(1).max(3),
      initialValue: 1,
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      description: 'アイコン名またはEmoji',
    }),
    defineField({
      name: 'color',
      title: 'Color',
      type: 'string',
      description: 'カテゴリカラー（HEXコード）',
      validation: (Rule) => Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error('有効なHEXカラーコードを入力してください'),
    }),
    defineField({
      name: 'metaTitle',
      title: 'SEO Title',
      type: 'string',
      description: 'カテゴリページのSEOタイトル',
      validation: (Rule) => Rule.max(60),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      description: 'カテゴリページのメタディスクリプション',
      validation: (Rule) => Rule.max(160),
    }),
    defineField({
      name: 'featured',
      title: 'Featured Category',
      type: 'boolean',
      description: 'メニューで強調表示',
      initialValue: false,
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      description: '表示順序',
      initialValue: 0,
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'カテゴリの有効/無効',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
      level: 'level',
    },
    prepare(selection) {
      const { title, subtitle, level } = selection
      const levelLabel = level === 1 ? 'メイン' : level === 2 ? 'サブ' : '詳細'
      return {
        title,
        subtitle: `${levelLabel} - ${subtitle}`,
      }
    },
  },
})