
const fs = require('fs');

const articlesFilePath = '/Users/user/prorenata/all-articles.json';

fs.readFile(articlesFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  try {
    const articles = JSON.parse(data);
    const uniqueArticles = [];
    const seenSlugs = new Set();

    for (const article of articles) {
      if (article.slug && article.slug.current) {
        if (!seenSlugs.has(article.slug.current)) {
          uniqueArticles.push(article);
          seenSlugs.add(article.slug.current);
        }
      }
    }

    const removedCount = articles.length - uniqueArticles.length;

    fs.writeFile(articlesFilePath, JSON.stringify(uniqueArticles, null, 2), 'utf8', (err) => {
      if (err) {
        console.error('Error writing the file:', err);
        return;
      }
      console.log(`Successfully removed ${removedCount} duplicate articles.`);
      console.log(`The file has been updated with ${uniqueArticles.length} unique articles.`);
    });
  } catch (parseErr) {
    console.error('Error parsing JSON:', parseErr);
  }
});
