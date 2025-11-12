const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false
});

async function verifyArticle() {
  const slug = 'nursing-assistant-resignation-advice-top';

  const query = `*[_type == "post" && slug.current == $slug][0]{
    title,
    body
  }`;

  const article = await client.fetch(query, { slug });

  console.log(`\n=== 修正後の記事構造確認 ===\n`);
  console.log(`記事: ${article.title}`);
  console.log(`総ブロック数: ${article.body.length}\n`);

  // H2とH3の見出しを抽出
  const headings = [];
  article.body.forEach((block, index) => {
    if (block.style === 'h2') {
      const text = block.children?.[0]?.text || '';
      headings.push({ type: 'H2', text, index });
      console.log(`[${index}] H2: ${text}`);
    } else if (block.style === 'h3') {
      const text = block.children?.[0]?.text || '';
      headings.push({ type: 'H3', text, index });
      console.log(`[${index}] H3: ${text}`);
    }
  });

  // 「次のステップ」を含むブロックをチェック
  let nextStepFound = false;
  article.body.forEach((block, index) => {
    if (block.style === 'normal') {
      const text = block.children?.[0]?.text || '';
      if (text.includes('次のステップ') || text.includes('次の勤務')) {
        console.log(`\n⚠️  「次のステップ」関連コンテンツが残っています: [${index}] ${text.substring(0, 50)}...`);
        nextStepFound = true;
      }
    }
  });

  // H2の重複チェック
  const h2Texts = headings.filter(h => h.type === 'H2').map(h => h.text);
  const h2Counts = {};
  h2Texts.forEach(text => {
    h2Counts[text] = (h2Counts[text] || 0) + 1;
  });

  console.log(`\n\n=== 重複チェック結果 ===`);
  let duplicatesFound = false;
  Object.entries(h2Counts).forEach(([text, count]) => {
    if (count > 1) {
      console.log(`⚠️  重複H2: "${text}" (${count}回出現)`);
      duplicatesFound = true;
    }
  });

  if (!duplicatesFound) {
    console.log(`✅ H2の重複なし`);
  }

  if (!nextStepFound) {
    console.log(`✅ 「次のステップ」関連コンテンツなし`);
  }

  console.log(`\n✅ 記事の整形が完了しました！`);
}

verifyArticle().catch(console.error);
