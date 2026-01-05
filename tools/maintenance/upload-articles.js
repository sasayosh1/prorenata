

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

    for (const article of articles) {
      if (article.body) { // bodyフィールドがあることを確認
        console.log(`Updating article: ${article.title}`);
        try {
          await client
            .patch(article._id)
            .set({ body: article.body }) // bodyフィールドの内容を更新
            .unset(['content']) // contentフィールドを削除
            .commit();
          console.log(`  ✅  Successfully updated: ${article.title}`);
        } catch (error) {
          console.error(`  ❌  Error updating ${article.title}:`, error.message);
        }
      }
    }

    console.log('\n🎉 All articles processed.');
  } catch (parseErr) {
    console.error('Error parsing JSON:', parseErr);
  }
});
