import { defineType, defineField } from 'sanity'
import { FolderIcon } from '@sanity/icons'

const CATEGORY_MASTER = [
  { title: '仕事', slug: 'work' },
  { title: '給与', slug: 'salary' },
  { title: '資格', slug: 'license' },
  { title: '転職', slug: 'career-change' },
  { title: '退職', slug: 'resignation' },
  { title: 'メンタル', slug: 'wellbeing' },
  { title: '体験', slug: 'stories' },
] as const

const CATEGORY_TITLES = CATEGORY_MASTER.map(c => c.title)

const CATEGORY_SLUG_MAP: Record<string, string> = CATEGORY_MASTER.reduce(
  (map, c) => {
    map[c.title] = c.slug
    return map
  },
  {} as Record<string, string>
)

export default defineType({
  name: 'category',
  title: 'カテゴリ',
  type: 'document',
  icon: FolderIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'カテゴリ名',
      type: 'string',
      description: 'ProReNata のカテゴリは「仕事 / 給与 / 資格 / 転職 / 退職 / 心身 / 体験」の7つのみです。',
      options: {
        list: CATEGORY_MASTER.map(c => ({
          title: c.title,
          value: c.title,
        })),
        layout: 'radio',
      },
      validation: Rule =>
        Rule.required().custom(value => {
          const typedValue = typeof value === 'string' ? value : undefined
          if (!typedValue) return 'カテゴリ名を選んでください。'
          if (!CATEGORY_TITLES.includes(typedValue as (typeof CATEGORY_TITLES)[number])) {
            return `「${CATEGORY_TITLES.join(' / ')}」のいずれかを選択してください。`
          }
          return true
        }),
    }),
    defineField({
      name: 'slug',
      title: 'スラッグ',
      type: 'slug',
      description: '英字スラッグはカテゴリ名に応じて固定されます。（例：仕事 → work）',
      options: {
        source: 'title',
        slugify: (input: string) => {
          const fixed = CATEGORY_SLUG_MAP[input]
          if (fixed) return fixed
          return input
            .normalize('NFKD')
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .toLowerCase()
        },
      },
      validation: Rule =>
        Rule.required().custom((value, context) => {
          if (!value?.current) return 'スラッグが設定されていません。'
          const title = (context.parent as { title?: string })?.title
          const expected = title ? CATEGORY_SLUG_MAP[title] : undefined
          if (expected && value.current !== expected) {
            return `このカテゴリのスラッグは「${expected}」にしてください。`
          }
          return true
        }),
    }),
    defineField({
      name: 'description',
      title: '説明（任意）',
      type: 'text',
      rows: 3,
      description: '白崎セラ視点で「このカテゴリでは何を書くか」をメモできます。（フロント非表示でもOK）',
    }),
    defineField({
      name: 'order',
      title: '表示順（任意）',
      type: 'number',
      description: 'ナビゲーションや一覧の表示順を制御します。（例：仕事=1）',
      validation: Rule => Rule.min(1).max(99),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'slug.current',
      order: 'order',
    },
    prepare(selection) {
      const { title, subtitle, order } = selection
      const prefix = typeof order === 'number' ? `#${order} ` : ''
      return {
        title: `${prefix}${title}`,
        subtitle,
        media: FolderIcon,
      }
    },
  },
})
