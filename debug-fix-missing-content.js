const fs = require('fs');
const { createClient } = require('@sanity/client');

// Import all the template and content generation functions
const { articleTemplates, generateArticleBody } = require('./archive/development-scripts/create-nursing-content.js');
const { additionalArticleTemplates, generateEnhancedArticleBody } = require('./archive/development-scripts/generate-additional-articles.js');
const { educationalContentTemplates, generateEducationalContent } = require('./archive/development-scripts/educational-content-templates.js');
const { careerSupportTemplates, generateCareerSupportContent } = require('./archive/development-scripts/career-support-content.js');
const { industryNewsTemplates, generateNewsContent } = require('./archive/development-scripts/industry-news-system.js');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

const allTemplates = [
  ...articleTemplates,
  ...additionalArticleTemplates,
  ...educationalContentTemplates,
  ...careerSupportTemplates,
  ...industryNewsTemplates,
];

const templateMap = new Map();
for (const template of allTemplates) {
  templateMap.set(template.slug, template);
}

const articlesToFix = JSON.parse(fs.readFileSync('null-content-articles.json', 'utf-8'));

async function fixMissingContent() {
  for (const article of articlesToFix) {
    const template = templateMap.get(article.slug.current);
    if (template) {
      let body;
      if (articleTemplates.includes(template)) {
        body = generateArticleBody(template);
      } else if (additionalArticleTemplates.includes(template)) {
        body = generateEnhancedArticleBody(template);
      } else if (educationalContentTemplates.includes(template)) {
        body = generateEducationalContent(template);
      } else if (careerSupportTemplates.includes(template)) {
        body = generateCareerSupportContent(template);
      } else if (industryNewsTemplates.includes(template)) {
        body = generateNewsContent(template);
      }

      if (body) {
        try {
          await client.patch(article._id).set({ body }).commit();
          console.log(`Fixed content for: ${article.title}`);
        } catch (error) {
          console.error(`Error fixing content for ${article.title}:`, error);
        }
      } else {
        console.log(`Could not generate body for: ${article.title}`);
      }
    } else {
      console.log(`No template found for: ${article.title}`);
    }
  }
}

fixMissingContent();
