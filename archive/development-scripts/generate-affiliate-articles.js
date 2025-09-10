require('dotenv').config();
const { createClient } = require('next-sanity');
const { faker } = require('@faker-js/faker');

// --- Sanity Client Configuration ---
const projectId = '72m8vhy2';
const dataset = 'production';
const apiVersion = '2024-01-01';
const token = process.env.SANITY_API_TOKEN;

if (!token) {
  console.error('Error: SANITY_API_TOKEN is not set.');
  console.error('Please set the environment variable before running this script.');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
});

// --- Article Content Definitions ---

const articleThemes = {
  jobDescription: {
    titleTemplates: [
      '看護助手の仕事内容とは？きついって本当？1日の流れを徹底解説',
      '未経験でもわかる！看護助手の仕事内容と役割、やりがい',
      '看護助手と看護師・介護士の違いは？仕事内容と必要なスキルを比較',
    ],
    bodyTemplates: [
      '本記事では、看護助手の具体的な仕事内容、1日のスケジュール、そして「きつい」と言われる理由について詳しく解説します。未経験から看護助手を目指す方は必見です。[AFFILIATE_LINK: 転職サイト]',
      '看護助手の仕事は、患者さんの身の回りのお世話から、看護師のサポートまで多岐にわたります。この記事で仕事内容の全体像を掴み、自分に合った職場を見つけましょう。[AFFILIATE_LINK: 転職サイト]',
    ],
    category: '56322374-a961-4512-9c81-66b3b224258b', // カテゴリID（例：仕事内容）
  },
  salary: {
    titleTemplates: [
      '看護助手の給料は安い？平均年収と月収、ボーナス事情を大公開',
      '給料アップを目指す！看護助手が収入を上げるための具体的な方法5選',
      '【地域別】看護助手の給料ランキング！あなたの地域の給与水準は？',
    ],
    bodyTemplates: [
      '看護助手の給料は、勤務地や経験によって大きく異なります。この記事では、全国の平均年収や、給料を上げるためのキャリアアップ方法について解説します。より高待遇の職場を探すなら、転職サイトの活用がおすすめです。[AFFILIATE_LINK: 転職サイト]',
      '資格取得は、看護助手が給料を上げるための確実な方法の一つです。介護職員初任者研修などの資格を取得して、専門性を高めましょう。[AFFILIATE_LINK: 資格講座]',
    ],
    category: '56322374-a961-4512-9c81-66b3b224258b', // カテゴリID（例：給料・待遇）
  },
  転職: {
    titleTemplates: [
      '【2025年版】看護助手におすすめの転職サイト5選！求人選びのコツ',
      '未経験から看護助手へ！志望動機の書き方と面接で聞かれる質問集',
      '看護助手の履歴書・職務経歴書の書き方【完全ガイド】',
    ],
    bodyTemplates: [
      '自分に合った職場を見つけるためには、転職サイトの活用が不可欠です。この記事では、看護助手の求人が豊富な転職サイトを厳選してご紹介します。まずは登録して、どんな求人があるかチェックしてみましょう。[AFFILIATE_LINK: 転職サイト]',
      '未経験からの転職でも、志望動機や面接対策をしっかり行えば大丈夫です。この記事で紹介するポイントを押さえて、自信を持って転職活動に臨みましょう。[AFFILIATE_LINK: 転職サイト]',
    ],
    category: '56322374-a961-4512-9c81-66b3b224258b', // カテゴリID（例：転職・就職）
  },
};

// --- Article Generation Logic ---

function generateArticle(themeKey) {
  const theme = articleThemes[themeKey];
  if (!theme) {
    console.error(`Error: Theme "${themeKey}" not found.`);
    return null;
  }

  const title = faker.helpers.arrayElement(theme.titleTemplates);
  const bodyText = faker.helpers.arrayElement(theme.bodyTemplates);

  const body = [
    {
      _type: 'block',
      style: 'normal',
      _key: faker.string.uuid(),
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: faker.string.uuid(),
          text: bodyText,
          marks: [],
        },
      ],
    },
  ];

  return {
    _type: 'post',
    title,
    slug: { _type: 'slug', current: faker.lorem.slug() },
    publishedAt: faker.date.past(),
    excerpt: title,
    body,
    author: { _type: 'reference', _ref: 'aefbe415-6b34-4085-97b2-30b2aa12a6fa' }, // ProReNata編集部
    categories: [{ _type: 'reference', _ref: theme.category }],
  };
}

// --- Sanity Data Creation with Delay ---

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function createPosts(totalPosts, postsPerBatch, delay) {
  console.log(`Starting to create ${totalPosts} new posts...`);

  for (let i = 0; i < totalPosts; i++) {
    const themeKey = faker.helpers.arrayElement(Object.keys(articleThemes));
    const post = generateArticle(themeKey);

    if (post) {
      try {
        const result = await client.create(post);
        console.log(`(${i + 1}/${totalPosts}) Created post: ${result.title}`);
      } catch (error) {
        console.error(`Error creating post "${post.title}":`, error);
      }
    }

    // Add a delay after each batch
    if ((i + 1) % postsPerBatch === 0 && i + 1 < totalPosts) {
      console.log(`--- Batch of ${postsPerBatch} created. Waiting for ${delay / 1000} seconds... ---`);
      await sleep(delay);
    }
  }

  console.log('Successfully created all posts!');
}

// --- Script Execution ---

// Command-line arguments
const totalPostsToCreate = parseInt(process.argv[2], 10) || 20; // Default: 20
const postsPerBatch = 5; // Create 5 posts then wait
const delayBetweenBatches = 5000; // 5 seconds

createPosts(totalPostsToCreate, postsPerBatch, delayBetweenBatches);