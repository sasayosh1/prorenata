

const fs = require('fs');

const articlesFilePath = '/Users/user/prorenata/all-articles.json';

fs.readFile(articlesFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  try {
    const articles = JSON.parse(data);
    let totalLength = 0;
    let articleCount = 0;

    for (const article of articles) {
      if (article.content) {
        // 改行コードを考慮して文字数をカウント
        totalLength += article.content.replace(/\n/g, '').length;
        articleCount++;
      }
    }

    const averageLength = articleCount > 0 ? totalLength / articleCount : 0;

    console.log(`現在の記事の平均文字数: ${averageLength.toFixed(2)}文字`);
    console.log(`コンテンツがある記事の総数: ${articleCount}件`);

  } catch (parseErr) {
    console.error('Error parsing JSON:', parseErr);
  }
});

