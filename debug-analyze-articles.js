const fs = require('fs');

const articles = JSON.parse(fs.readFileSync('all-articles.json', 'utf-8'));

const analysis = {
  duplicates: {
    byTitle: [],
    bySlug: [],
  },
  missing: {
    excerpt: [],
    content: [],
    slug: [],
  },
  drafts: [],
};

const titles = new Map();
const slugs = new Map();

for (const article of articles) {
  if (article._id.startsWith('drafts.')) {
    analysis.drafts.push(article);
    continue;
  }

  // Check for duplicate titles
  if (titles.has(article.title)) {
    const existing = titles.get(article.title);
    if (existing.length === 1) {
      analysis.duplicates.byTitle.push(existing[0]);
    }
    analysis.duplicates.byTitle.push(article);
    existing.push(article);
  } else {
    titles.set(article.title, [article]);
  }

  // Check for duplicate slugs
  if (article.slug && article.slug.current) {
    if (slugs.has(article.slug.current)) {
      const existing = slugs.get(article.slug.current);
      if (existing.length === 1) {
        analysis.duplicates.bySlug.push(existing[0]);
      }
      analysis.duplicates.bySlug.push(article);
      existing.push(article);
    } else {
      slugs.set(article.slug.current, [article]);
    }
  } else {
    analysis.missing.slug.push(article);
  }

  // Check for missing excerpts
  if (!article.excerpt) {
    analysis.missing.excerpt.push(article);
  }

  // Check for null content
  if (article.content === null) {
    analysis.missing.content.push(article);
  }
}

console.log('--- Analysis Report ---');
console.log(`Total articles: ${articles.length}`);
console.log(`\n--- Drafts (${analysis.drafts.length}) ---`);
analysis.drafts.forEach(article => {
    console.log(`- [${article._id}] ${article.title}`);
});

console.log(`\n--- Duplicates by Title (${analysis.duplicates.byTitle.length}) ---`);
analysis.duplicates.byTitle.forEach(article => {
    console.log(`- [${article._id}] ${article.title}`);
});

console.log(`\n--- Duplicates by Slug (${analysis.duplicates.bySlug.length}) ---`);
analysis.duplicates.bySlug.forEach(article => {
    console.log(`- [${article._id}] ${article.slug.current} ("${article.title}")`);
});

console.log(`\n--- Missing Excerpt (${analysis.missing.excerpt.length}) ---`);
analysis.missing.excerpt.forEach(article => {
    console.log(`- [${article._id}] ${article.title}`);
});

console.log(`\n--- Missing Content (${analysis.missing.content.length}) ---`);
analysis.missing.content.forEach(article => {
    console.log(`- [${article._id}] ${article.title}`);
});

console.log(`\n--- Missing Slug (${analysis.missing.slug.length}) ---`);
analysis.missing.slug.forEach(article => {
    console.log(`- [${article._id}] ${article.title}`);
});

console.log('\n--- End of Report ---');