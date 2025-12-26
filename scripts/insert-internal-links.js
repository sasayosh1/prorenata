const { createClient } = require('@sanity/client');

const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN;
if (!token) {
  console.error('Error: SANITY_WRITE_TOKEN or SANITY_API_TOKEN is required.');
  process.exit(1);
}

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
});

// Mapping of Source Article -> Target Killer Page & CTA Content
const LINK_JOBS = [
  {
    sourceSlug: 'nursing-assistant-resignation-advice-insights', // 36 views
    targetSlug: 'comparison-of-three-resignation-agencies',
    ctaHeading: 'どうしても自分で伝えるのが難しい場合',
    ctaText: '「上司が怖くて言い出せない」「引き止めにあって辞められない」という場合は、無理をせず専門家を頼るのも一つの賢い選択です。即日で退職できるサービスについてまとめました。',
    linkText: '【2026年最新】看護助手におすすめの退職代行3社を徹底比較'
  },
  {
    sourceSlug: 'nursing-assistant-quit-retirement', // 25 views
    targetSlug: 'comparison-of-three-resignation-agencies',
    ctaHeading: 'トラブルなく即日で辞めたいなら',
    ctaText: '職場との関係が悪化していて、顔を合わせずに退職したい場合は、退職代行サービスがあなたの盾になってくれます。',
    linkText: '看護助手の退職代行サービス3社比較｜失敗しない選び方'
  },
  {
    sourceSlug: 'nursing-assistant-latest-salary-comparison', // High High Impressions
    targetSlug: 'nursing-assistant-compare-services-perspective',
    ctaHeading: '給料アップを目指すなら転職も視野に',
    ctaText: '今の職場の給料に納得がいかない場合、他の病院や施設の条件を見てみるだけでも市場価値がわかります。看護助手の転職に強いエージェントを活用しましょう。',
    linkText: '【2026年版】看護助手おすすめ転職サービス3社比較｜給料アップ実績あり'
  },
  {
    sourceSlug: 'nursing-assistant-night-shift-journey', // 30 views
    targetSlug: 'nursing-assistant-compare-services-perspective',
    ctaHeading: '夜勤のない働き方や好条件を探す',
    ctaText: '「夜勤がつらい」「もっと手当が欲しい」という悩みは、職場を変えることで解決できることが多いです。まずは情報収集から始めてみませんか？',
    linkText: '看護助手におすすめの転職サービス3社を見る'
  }
];

// Helper to create blocks
function createBlock(text, style = 'normal', marks = []) {
  return {
    _type: 'block',
    style: style,
    children: [{ _type: 'span', text, marks }]
  };
}

function createLinkBlock(text, href) {
  const markKey = Math.random().toString(36).substring(7);
  return {
    _type: 'block',
    style: 'normal',
    children: [
      { _type: 'span', text: '👉 ' }, // Visual cue
      {
        _type: 'span',
        text: text,
        marks: [markKey]
      }
    ],
    markDefs: [
      {
        _key: markKey,
        _type: 'link',
        href: `https://prorenata.jp/posts/${href}` // Absolute link for safety or relative
      }
    ]
  };
}

async function insertInternalLinks() {
  console.log('=== Inserting Internal Links ===\n');

  for (const job of LINK_JOBS) {
    console.log(`Processing: ${job.sourceSlug} -> ${job.targetSlug}`);

    const post = await client.fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug: job.sourceSlug });

    if (!post) {
      console.log(`  ❌ Article not found: ${job.sourceSlug}`);
      continue;
    }

    // Check if link already exists to avoid duplication
    const alreadyLinked = JSON.stringify(post.body).includes(job.targetSlug);
    if (alreadyLinked) {
      console.log('  ⚠️ Link already exists. Skipping.');
      continue;
    }

    // Find insertion point: Before the last H2 (which is usually Matome)
    let insertIndex = post.body.length - 1;
    for (let i = post.body.length - 1; i >= 0; i--) {
      if (post.body[i].style === 'h2') {
        insertIndex = i;
        break;
      }
    }

    // If no H2 found, append to end
    if (insertIndex < 0) insertIndex = post.body.length;

    // Create new blocks
    const newBlocks = [
      createBlock(job.ctaHeading, 'h2'),
      createBlock(job.ctaText),
      createLinkBlock(job.linkText, job.targetSlug)
    ];

    // Insert
    const newBody = [...post.body];
    newBody.splice(insertIndex, 0, ...newBlocks);

    // Update
    await client.patch(post._id).set({ body: newBody }).commit();
    console.log(`  ✅ Inserted link at block ${insertIndex}`);
  }

  console.log('\n✨ Internal linking complete!');
}

insertInternalLinks().catch(console.error);
