
const fs = require('fs');
const { createClient } = require('@sanity/client');

const articlesFilePath = '/Users/user/prorenata/all-articles.json';
const sanityToken = 'skkTjwpdrsjKKpaDxKVShzCSI7GMWE1r5TQdwl0b7LTylVPoAxzBg0oPqhtUQyfPjyvtZW2mu6nfUMNUJ';

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: sanityToken,
});

fs.readFile(articlesFilePath, 'utf8', async (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  try {
    const articles = JSON.parse(data);
    let allBodyFieldsEmpty = true;

    console.log('--- Sanity上の各記事のbodyフィールド確認 ---');
    for (const article of articles) {
      try {
        const sanityDoc = await client.fetch(`*[_id == "${article._id}"]{_id, title, body}[0]`);
        if (sanityDoc && sanityDoc.body) {
          console.log(`記事: 「${sanityDoc.title}」 - bodyフィールドが存在します。`);
          allBodyFieldsEmpty = false;
        } else {
          console.log(`記事: 「${sanityDoc.title}」 - bodyフィールドは空または存在しません。`);
        }
      } catch (error) {
        console.error(`記事「${article.title}」の取得中にエラー:`, error.message);
        allBodyFieldsEmpty = false; // エラーが発生した場合も空ではないとみなす
      }
    }

    console.log('----------------------------------------');
    if (allBodyFieldsEmpty) {
      console.log('✅ 全ての記事のbodyフィールドが空または存在しませんでした。');
    } else {
      console.log('❌ 一部または全ての記事でbodyフィールドが存在します。');
    }

  } catch (parseErr) {
    console.error('Error parsing JSON:', parseErr);
  }
});
