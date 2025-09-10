import { type StructureResolver } from 'sanity/desk'

export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('post').title('Post'),
      S.documentTypeListItem('category').title('Category'),
      // S.documentTypeListItem('author').title('Author'),
    ])

export default deskStructure