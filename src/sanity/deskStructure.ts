import type { StructureBuilder } from 'sanity/structure'

export const deskStructure = (S: StructureBuilder) =>
  S.list()
    .title('ProReNata CMS')
    .items([
      // Site Settings (Singleton)
      S.listItem()
        .title('全般設定')
        .id('siteSettings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('全般設定（免責・メッセージ）')
        ),
      S.divider(),
      // 記事管理
      S.listItem()
        .title('コンテンツ管理')
        .child(
          S.list()
            .title('コンテンツ')
            .items([
              S.documentTypeListItem('post').title('記事一覧'),
              S.documentTypeListItem('category').title('カテゴリー'),
              // S.documentTypeListItem('author').title('著者'),
            ])
        ),
      // マスタ管理
      S.listItem()
        .title('マスタ/共通部品')
        .child(
          S.list()
            .title('共通部品')
            .items([
              S.documentTypeListItem('author').title('著者/メンバー'),
              S.documentTypeListItem('affiliateEmbed').title('アフィリエイト'),
              S.documentTypeListItem('faqItem').title('FAQアイテム'),
              S.documentTypeListItem('speechBubble').title('吹き出し定義'),
            ])
        ),
    ])
