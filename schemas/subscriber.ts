import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'subscriber',
  title: 'Newsletter Subscriber',
  type: 'document',
  fields: [
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'subscribedAt',
      title: 'Subscribed At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'unsubscribedAt',
      title: 'Unsubscribed At',
      type: 'datetime',
    }),
  ],
  preview: {
    select: {
      title: 'email',
      subtitle: 'subscribedAt',
    },
  },
})
