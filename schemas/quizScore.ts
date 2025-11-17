import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'quizScore',
  title: 'クイズスコア',
  type: 'document',
  fields: [
    defineField({
      name: 'playerName',
      title: 'プレイヤー名',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'score',
      title: 'スコア',
      type: 'number',
      validation: (Rule) => Rule.required().min(0).max(5),
    }),
    defineField({
      name: 'correctAnswers',
      title: '正解数',
      type: 'number',
      validation: (Rule) => Rule.required().min(0).max(5),
    }),
    defineField({
      name: 'totalQuestions',
      title: '総問題数',
      type: 'number',
      validation: (Rule) => Rule.required().min(0).max(5),
    }),
    defineField({
      name: 'playedAt',
      title: 'プレイ日時',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'playerName',
      subtitle: 'score',
      playedAt: 'playedAt',
    },
    prepare({ title, subtitle, playedAt }) {
      return {
        title: title,
        subtitle: `スコア: ${subtitle} (${new Date(playedAt).toLocaleDateString('ja-JP')})`,
      }
    },
  },
})
