const { createClient } = require('@sanity/client')

// トークンなしでパブリック作成を試行
const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  perspective: 'raw'
})

async function createContent() {
  try {
    console.log('Testing Sanity dataset settings...')
    
    // データセット情報取得
    const datasets = await fetch(`https://72m8vhy2.api.sanity.io/v1/datasets`).then(r => r.json())
    console.log('Available datasets:', datasets)
    
    // プロジェクト情報取得
    const project = await fetch(`https://api.sanity.io/v1/projects/72m8vhy2`).then(r => r.json())
    console.log('Project info:', project)
    
  } catch (error) {
    console.error('Error:', error)
  }
}

createContent()