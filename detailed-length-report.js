

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
    let articleWithContentCount = 0;

    console.log('--- 各記事の文字数詳細 ---');
    articles.forEach((article, index) => {
      const title = article.title || 'タイトルなし';
      const content = article.content;
      let length = 0;

      if (content) {
        // 改行コードとMarkdown記号（#、-、*、>など）を削除して文字数をカウント
        // 日本語の文字数を正確にカウントするため、Unicodeの文字数を数える
        length = content.replace(/\n/g, '')
                        .replace(/\s+/g, '') // 連続する空白も削除
                        .replace(/[#\-*>[\]()`~!@$%^&+=|\\{};:',.<>/?]/g, '') // 主要なMarkdown記号を削除
                        .length;
        totalLength += length;
        articleWithContentCount++;
        console.log(`記事 ${index + 1}: 「${title}」 - ${length}文字 (コンテンツあり)`);
      } else {
        console.log(`記事 ${index + 1}: 「${title}」 - コンテンツなし`);
      }
    });

    const averageLength = articleWithContentCount > 0 ? totalLength / articleWithContentCount : 0;

    console.log('------------------------');
    console.log(`コンテンツがある記事の総数: ${articleWithContentCount}件`);
    console.log(`コンテンツがある記事の平均文字数: ${averageLength.toFixed(2)}文字`);

  } catch (parseErr) {
    console.error('Error parsing JSON:', parseErr);
  }
});

