const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const LINKS_TO_ADD = [
  {
    sourceSlug: 'nursing-assistant-become-nurse-guide', // 看護師への道
    relatedArticles: [
      { slug: 'nursing-assistant-career-change-school', title: '看護助手から看護学校へ進学するキャリアパス' },
      { slug: 'nursing-assistant-scholarship-merit', title: '看護奨学金のメリット・デメリット徹底解説' }, // Assuming slug exists, verify later
      { slug: 'nursing-assistant-qualification-study', title: '働きながら合格！勉強スケジュール' }
    ]
  },
  {
    sourceSlug: 'nursing-assistant-qualification-guide', // 資格ガイド
    relatedArticles: [
      { slug: 'nursing-assistant-qualification-study-recommended', title: '看護助手に役立つ資格5選' },
      { slug: 'nursing-assistant-certification-merit', title: '看護助手資格取得の3大メリット' }, // Note: This slug might have been redirected/renamed? Check.
      { slug: 'nursing-assistant-self-study-qualifications', title: '看護助手の資格勉強は独学でも大丈夫？' }
    ]
  },
  {
    sourceSlug: 'nursing-assistant-resume-writing', // 履歴書
    relatedArticles: [
      { slug: 'nursing-assistant-interview-prep', title: '面接当日の流れとポイント' },
      { slug: 'nursing-assistant-appeal-physical-strength', title: '面接で「体力に自信あります」をアピールする言い方' },
      { slug: 'nursing-assistant-self-pr-examples', title: '看護助手の自己PR例文集' } // Assuming slug
    ]
  }
];

async function addInternalLinks() {
  console.log('=== Adding Internal Links ===\n');

  for (const item of LINKS_TO_ADD) {
    try {
      console.log(`Processing Source: ${item.sourceSlug}`);
      const article = await client.fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug: item.sourceSlug });

      if (!article) {
        console.error(`  ❌ Source article not found: ${item.sourceSlug}`);
        continue;
      }

      // Verify target articles exist
      const validLinks = [];
      for (const related of item.relatedArticles) {
        const target = await client.fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug: related.slug });
        if (target) {
          validLinks.push(related);
        } else {
          console.warn(`  ⚠️ Target article not found: ${related.slug}`);
        }
      }

      if (validLinks.length === 0) {
        console.log('  No valid links to add.');
        continue;
      }

      // Create "Read Also" block
      const linksBlock = {
        _type: 'block',
        style: 'normal',
        children: [
          { _type: 'span', text: '▼あわせて読みたい記事', marks: ['strong'] }
        ]
      };

      const listItems = validLinks.map(link => ({
        _type: 'block',
        style: 'normal',
        listItem: 'bullet',
        markDefs: [
          {
            _key: `link-${Date.now()}-${Math.random()}`,
            _type: 'link',
            href: `/posts/${link.slug}`
          }
        ],
        children: [
          {
            _type: 'span',
            text: link.title,
            marks: [`link-${Date.now()}-${Math.random()}`] // Note: In Sanity, marks need to reference _key. This simple script might need adjustment for correct mark referencing.
          }
        ]
      }));

      // Correct way to add links in Sanity block content is complex via script. 
      // Simplified approach: Add a text block with links? No, better to use proper structure.
      // Let's try to construct proper Portable Text.

      const portableTextLinks = validLinks.map(link => {
        const linkKey = `link-${Math.random().toString(36).substr(2, 9)}`;
        return {
          _type: 'block',
          style: 'normal',
          listItem: 'bullet',
          markDefs: [
            {
              _key: linkKey,
              _type: 'link',
              href: `/posts/${link.slug}`
            }
          ],
          children: [
            {
              _type: 'span',
              text: link.title,
              marks: [linkKey]
            }
          ]
        };
      });

      // Insert at the end of the body
      await client.patch(article._id)
        .setIfMissing({ body: [] })
        .insert('after', 'body[-1]', [linksBlock, ...portableTextLinks])
        .commit();

      console.log(`  ✅ Added ${validLinks.length} links to ${item.sourceSlug}\n`);

    } catch (error) {
      console.error(`  ❌ Error processing ${item.sourceSlug}:`, error.message);
    }
  }
}

addInternalLinks();
