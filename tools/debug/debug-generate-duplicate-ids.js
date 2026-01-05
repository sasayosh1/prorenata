const fs = require('fs');

const articles = JSON.parse(fs.readFileSync('all-articles.json', 'utf-8'));

const titles = new Map();
const idsToDelete = [];

for (const article of articles) {
  if (article._id.startsWith('drafts.')) {
    continue;
  }

  if (titles.has(article.title)) {
    const existing = titles.get(article.title);
    existing.push(article);
  } else {
    titles.set(article.title, [article]);
  }
}

for (const [title, articles] of titles.entries()) {
  if (articles.length > 1) {
    // Keep the first one, delete the rest
    for (let i = 1; i < articles.length; i++) {
      idsToDelete.push(articles[i]._id);
    }
  }
}

fs.writeFileSync('duplicate-ids-to-delete.json', JSON.stringify(idsToDelete, null, 2));
console.log(`Found ${idsToDelete.length} duplicate articles to delete.`);
