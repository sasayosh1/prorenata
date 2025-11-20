import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: rule => rule.required().max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
        slugify: (input: string) => {
          // 日本語キーワードを英語に変換（SEO重視の核心ワードのみ）
          const keywordMap: Record<string, string> = {
            'シフト': 'shift',
            '夜勤': 'night-shift',
            '給料': 'salary',
            '年収': 'income',
            '転職': 'career',
            '辞めたい': 'quit',
            '退職': 'retirement',
            '資格': 'qualification',
            '仕事': 'work',
            '業務': 'duties',
            '人間関係': 'relationship',
            'やりがい': 'reward',
            '求人': 'job',
            'スキル': 'skill',
            '未経験': 'beginner',
            'きつい': 'tough',
            'パート': 'part-time',
            '正社員': 'full-time',
            'メリット': 'merit',
            'デメリット': 'demerit',
            'コツ': 'tips',
            '方法': 'method',
            '理由': 'reason',
            '悩み': 'concern',
            'キャリア': 'career',
            '朝': 'morning',
            '昼': 'day',
            '夜': 'night',
            '専従': 'dedicated',
          }

          // タイトルから重要キーワードを抽出（2〜3語）
          let keywords: string[] = []
          for (const [jp, en] of Object.entries(keywordMap)) {
            if (input.includes(jp)) {
              keywords.push(en)
              if (keywords.length >= 3) break // 最大3語
            }
          }

          // キーワードが2語未満の場合、タイトルから補完
          if (keywords.length < 2) {
            const titleWords = input
              .replace(/【|】|[・、。！？]/g, ' ')
              .split(/\s+/)
              .filter(w => w.length > 0)

            for (const word of titleWords) {
              for (const [jp, en] of Object.entries(keywordMap)) {
                if (word.includes(jp) && !keywords.includes(en)) {
                  keywords.push(en)
                  if (keywords.length >= 2) break
                }
              }
              if (keywords.length >= 2) break
            }
          }

          // デフォルト（キーワードが見つからない場合）
          if (keywords.length === 0) {
            keywords = ['general']
          }

          // nursing-assistant- で始まるスラッグを生成（タイムスタンプなし）
          const slug = keywords.slice(0, 3).join('-')
          return `nursing-assistant-${slug}`
        }
      },
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'H4', value: 'h4'},
            {title: 'Quote', value: 'blockquote'},
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Number', value: 'number'},
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
              {title: 'Code', value: 'code'},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'URL',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                    validation: rule => rule.uri({
                      allowRelative: true,
                      scheme: ['http', 'https', 'mailto', 'tel']
                    })
                  },
                  {
                    name: 'openInNewTab',
                    type: 'boolean',
                    title: 'Open in new tab',
                    initialValue: false
                  }
                ]
              }
            ]
          }
        }),
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative text',
            }
          ]
        }),
        defineArrayMember({
          type: 'affiliateEmbed',
        }),
      ],
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'reference', to: [{type: 'category'}] }],
      validation: rule => rule.min(1)
    }),
    defineField({
      name: 'maintenanceLocked',
      title: '自動編集ロック',
      type: 'boolean',
      initialValue: false,
      description: 'true にするとメンテナンススクリプトや自動処理（バイブコーディング）で本文が変更されなくなります（手動のみ編集可能）',
    }),
    defineField({
      name: 'internalOnly',
      title: '内部限定コンテンツ',
      type: 'boolean',
      initialValue: false,
      description: 'true の場合は検索/一覧/サイトマップから除外し、robots noindex を付与します',
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
      readOnly: true,
      hidden: true,
      description: '自動付与される著者情報（編集画面では非表示）',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      description: '記事に関連するタグ（10個程度を推奨）',
      options: {
        layout: 'tags'
      },
      validation: rule => rule.max(15).warning('タグは10個程度が推奨されます')
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      description: '記事の要約（100〜150文字）',
      rows: 3,
      validation: rule => rule.max(200)
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description (SEO)',
      type: 'text',
      description: '検索結果に表示される説明文（120〜160文字推奨）',
      rows: 3,
      validation: rule => rule.min(120).max(160)
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      initialValue: () => (new Date()).toISOString(),
    }),
    defineField({
      name: 'views',
      title: 'Views',
      type: 'number',
      description: '記事の閲覧数（自動カウント）',
      readOnly: true,
      initialValue: 0,
    }),
    defineField({
      name: 'geminiMaintainedAt',
      title: 'Gemini Maintained At',
      type: 'datetime',
      readOnly: true,
      hidden: true,
      description: 'Geminiでのメンテナンス実行日時（自動更新）',
    }),
  ],
  preview: {
    select: { title: 'title', media: 'mainImage', subtitle: 'slug.current', description: 'body' },
    prepare(selection) {
      const {title, subtitle} = selection
      return {
        title,
        subtitle: subtitle ? `/posts/${subtitle}` : 'No slug'
      }
    }
  },
  orderings: [
    { title: 'Publish date (new→old)', name: 'pubDesc', by: [{field: 'publishedAt', direction: 'desc'}] },
    { title: 'Title (A→Z)', name: 'titleAsc', by: [{field: 'title', direction: 'asc'}] },
  ],
})
