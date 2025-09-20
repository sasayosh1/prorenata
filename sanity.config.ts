import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'
import deskStructure from './deskStructure'

const devUrl = 'http://localhost:3000'
const prodUrl = 'https://prorenata.jp'

export default defineConfig({
  name: 'default',
  title: 'prorenata',
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  plugins: [
    structureTool({
      structure: deskStructure
    }),
    visionTool()
  ],
  schema: {
    types: schemaTypes,
  },
  document: {
    productionUrl: async (prev, { document }) => {
      const baseUrl = devUrl
      if (document._type === 'post' && document.slug && typeof document.slug === 'object' && 'current' in document.slug && document.slug.current) {
        return `${baseUrl}/posts/${document.slug.current}`
      }
      return prev
    },
  },
})