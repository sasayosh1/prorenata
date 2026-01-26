import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'disclaimerEnabled',
      title: 'Disclaimer Enabled',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'disclaimerTitle',
      title: 'Disclaimer Title',
      type: 'string',
      initialValue: '免責事項',
    }),
    defineField({
      name: 'disclaimerBody',
      title: 'Disclaimer Body',
      type: 'blockContent',
    }),
    defineField({
      name: 'trustEnabled',
      title: 'Trust Block Enabled',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'trustTitle',
      title: 'Trust Block Title',
      type: 'string',
      initialValue: 'この記事について',
    }),
    defineField({
      name: 'trustBody',
      title: 'Trust Block Body',
      type: 'blockContent',
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Site Settings',
      }
    },
  },
})
