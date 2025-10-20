import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'
import { PreviewAction } from './src/sanity/actions/PreviewAction'

const prodUrl = 'https://prorenata.jp'
const previewSecret = process.env.SANITY_STUDIO_PREVIEW_SECRET
const previewBaseUrl = process.env.SANITY_STUDIO_PREVIEW_BASE_URL || prodUrl

export default defineConfig({
  name: 'default',
  title: 'ProReNata',
  projectId: '72m8vhy2',
  dataset: 'production',
  studioHost: 'prorenata',
  apiVersion: '2024-01-01',
  plugins: [
    structureTool(),
    visionTool()
  ],
  schema: {
    types: schemaTypes,
  },
  document: {
    actions: (prev, context) => {
      if (context.schemaType === 'post') {
        return [...prev, PreviewAction]
      }
      return prev
    },
    productionUrl: async (prev, { document }) => {
      const baseUrl = previewBaseUrl
      if (
        document._type === 'post' &&
        document.slug &&
        typeof document.slug === 'object' &&
        'current' in document.slug &&
        document.slug.current
      ) {
        const url = new URL(`${baseUrl}/api/preview`)
        url.searchParams.set('slug', document.slug.current as string)
        if (previewSecret) {
          url.searchParams.set('secret', previewSecret)
        }
        return url.toString()
      }
      return prev
    },
  },
})
