import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'seraAdvice',
  title: "セラの助言 (Sera's Advice)",
  type: 'object',
  fields: [
    defineField({
      name: 'content',
      title: '助言内容',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
      description: 'セラからの具体的で断定的なアドバイス。読者の迷いを断ち切り、明確な選択肢を提示する場合に使用してください。',
    }),
  ],
  preview: {
    select: {
      content: 'content',
    },
    prepare({ content }) {
      return {
        title: 'セラの助言',
        subtitle: content,
      }
    },
  },
})
