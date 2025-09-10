import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'
import deskStructure from './deskStructure'

export default defineConfig({
  name: 'default',
  title: 'prorenata',
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  plugins: [deskTool({ structure: deskStructure }), visionTool()],
  schema: {
    types: schemaTypes,
  },
})