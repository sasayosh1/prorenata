import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'faqItem',
    title: 'FAQ Item',
    type: 'object',
    fields: [
        defineField({
            name: 'question',
            title: 'Question',
            type: 'string',
            validation: rule => rule.required()
        }),
        defineField({
            name: 'answer',
            title: 'Answer',
            type: 'text',
            rows: 3,
            validation: rule => rule.required()
        }),
    ],
    preview: {
        select: {
            title: 'question',
            subtitle: 'answer'
        }
    }
})
