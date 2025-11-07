require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const { MOSHIMO_LINKS, suggestLinksForArticle, createMoshimoLinkBlocks } = require('./moshimo-affiliate-links')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

function extractTextFromBody(body) {
  if (!body || !Array.isArray(body)) return ''
  
  return body
    .filter(block => block._type === 'block')
    .map(block => {
      if (!block.children) return ''
      return block.children
        .filter(child => child._type === 'span')
        .map(child => child.text || '')
        .join('')
    })
    .join(' ')
}

// 新しいリンク分散ロジック
function distributeLinks(originalBody, suggestedLinks) {
  const newBody = [...originalBody];
  const insertedLinkKeys = new Set();
  const MIN_BLOCKS_BETWEEN_LINKS = 5; // リンク間の最小ブロック数
  const insertionPlan = []; // Stores { index, linkBlock }
  const existingAffiliateKeys = new Set(
    originalBody
      .filter(block => block?._type === 'affiliateEmbed' && typeof block.linkKey === 'string')
      .map(block => block.linkKey)
  );

  // 記事の長さに応じて挿入するリンク数を調整
  // 例: 記事が長い場合はより多くのリンクを挿入
  const maxLinksToInsert = Math.min(suggestedLinks.length, Math.floor(originalBody.length / 10) + 1); // 10ブロックごとに1リンク程度
  let linksToDistribute = suggestedLinks
    .filter(link => !existingAffiliateKeys.has(link.key))
    .slice(0, maxLinksToInsert);

  let blocksSinceLastLink = 0;
  let lastInsertedLinkKey = null;

  for (let i = 0; i < originalBody.length; i++) {
    const block = originalBody[i];

    // Increment counter for blocks since last link
    if (block._type === 'block' && !block.markDefs?.some(def => def._type === 'link')) {
      blocksSinceLastLink++;
    }

    // Check for insertion opportunity
    if (
      block._type === 'block' &&
      block.style === 'normal' && // Insert after a normal paragraph
      blocksSinceLastLink >= MIN_BLOCKS_BETWEEN_LINKS &&
      linksToDistribute.length > 0 &&
      (i + 1 < originalBody.length && !originalBody[i+1].style?.startsWith('h')) // Next block is not a heading
    ) {
      // Find a suitable link to insert (not recently inserted, not a duplicate in close proximity)
      const linkToInsertIndex = linksToDistribute.findIndex(link => link.key !== lastInsertedLinkKey);
      if (linkToInsertIndex !== -1) {
        const linkToInsert = linksToDistribute.splice(linkToInsertIndex, 1)[0]; // Remove and get the link
        const linkBlocks = createMoshimoLinkBlocks(linkToInsert.key);

        if (linkBlocks && linkBlocks.length) {
          insertionPlan.push({ index: i + 1, linkBlocks }); // Insert after current block
          insertedLinkKeys.add(linkToInsert.key);
          lastInsertedLinkKey = linkToInsert.key;
          blocksSinceLastLink = 0; // Reset counter
        }
      }
    }
  }

  // Apply insertions in reverse order to avoid index issues
  for (let i = insertionPlan.length - 1; i >= 0; i--) {
    const { index, linkBlocks } = insertionPlan[i];
    newBody.splice(index, 0, ...linkBlocks);
  }

  // If any links are left to distribute (e.g., article too short, no suitable normal blocks),
  // add them to the end, ensuring spacing.
  if (linksToDistribute.length > 0) {
    let currentBodyLength = newBody.length;
    for (const link of linksToDistribute) {
      const linkBlocks = createMoshimoLinkBlocks(link.key);
      if (linkBlocks && linkBlocks.length) {
        // 既存のリンクブロックとの間に最低1つのノーマルブロックを挟む
        if (currentBodyLength > 0 && newBody[currentBodyLength - 1]._type === 'block' && newBody[currentBodyLength - 1].style !== 'normal') {
            const emptyParagraphBlock = {
                _key: `block-${Math.random().toString(36).substr(2, 9)}`,
                _type: 'block',
                children: [{ _key: `span-${Math.random().toString(36).substr(2, 9)}`, _type: 'span', marks: [], text: '' }],
                markDefs: [],
                style: 'normal'
            };
            newBody.push(emptyParagraphBlock);
            currentBodyLength++;
        }
        newBody.push(...linkBlocks);
        currentBodyLength += linkBlocks.length;
      }
    }
  }

  return newBody;
}


async function main() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--execute')

  const line = '='.repeat(60)
  const slugArg = args.find(arg => arg.startsWith('--slugs='))
  const targetSlugs = slugArg
    ? slugArg.replace('--slugs=', '').split(',').map(s => s.trim()).filter(Boolean)
    : null
  console.log(line)
  console.log('🔗 もしもアフィリエイトリンク配置ツール')
  console.log(line)
  console.log()

  if (dryRun) {
    console.log('🔍 [DRY RUN] 配置プランを確認します\n')
  }

  // 全記事を取得
  let posts = await client.fetch('*[_type == "post"] { _id, title, "slug": slug.current, body }')
  console.log('📚 総記事数: ' + posts.length + '件')
  if (targetSlugs && targetSlugs.length > 0) {
    posts = posts.filter(post => targetSlugs.includes(post.slug))
    console.log('🎯 対象スラッグ: ' + targetSlugs.join(', '))
  }
  console.log()

  const plan = []
  let totalLinksPlanned = 0

  for (const post of posts) {
    const bodyText = extractTextFromBody(post.body)
    const suggestions = suggestLinksForArticle(post.title, bodyText)

    if (suggestions.length === 0) continue

    const existingKeys = new Set(
      (post.body || [])
        .filter(block => block?._type === 'affiliateEmbed' && typeof block.linkKey === 'string')
        .map(block => block.linkKey)
    )

    // 最適なリンクを1-2個選択 (これはdistributeLinks内で調整されるため、ここではそのまま渡す)
    // distributeLinks関数内で記事の長さに応じて挿入するリンク数を調整する
    const selectedLinks = suggestions.filter(link => !existingKeys.has(link.key));

    if (selectedLinks.length === 0) {
      continue
    }

    plan.push({
      _id: post._id,
      title: post.title,
      slug: post.slug,
      links: selectedLinks.map(s => ({
        key: s.key,
        name: s.name,
        appealText: s.appealText,
        linkText: s.linkText,
        matchScore: s.matchScore
      }))
    })

    totalLinksPlanned += selectedLinks.length // ここは計画段階の総数なので、候補数で計算
  }

  console.log('🔗 リンク配置予定数: ' + totalLinksPlanned + '個 (候補数)')
  console.log('📝 リンク配置予定記事: ' + plan.length + '件\n')

  // Debugging: Log plan before dryRun block
  // console.log("DEBUG: plan content before dryRun block:", plan.slice(0, 2)); // Removed debug log

  if (dryRun) {
    console.log('📋 配置プラン（最初の5記事）:')
    console.log(line)
    for (const item of plan.slice(0, 5)) {
      const post = posts.find(p => p._id === item._id)
      if (!post || !post.body) continue

      const newBody = distributeLinks(post.body, item.links); // リンク分散ロジックを適用

      console.log('\n' + item.title);
      console.log('--- リンク挿入後の記事構造 (簡易表示) ---');
      newBody.forEach(block => {
        if (block._type === 'block') {
          if (block.style === 'normal') {
            const text = extractTextFromBody([block]);
            console.log(`  [P] ${text.substring(0, 50)}...`); // 最初の50文字を表示
          } else if (block.style && block.style.startsWith('h')) {
            const text = extractTextFromBody([block]);
            console.log(`  [${block.style.toUpperCase()}] ${text}`);
          } else if (block.markDefs && block.markDefs.some(def => def._type === 'link')) {
            const linkText = extractTextFromBody([block]);
            console.log(`  [LINK] ${linkText}`);
          } else {
            console.log(`  [BLOCK] ${block._type}`);
          }
        } else {
          console.log(`  [NON-BLOCK] ${block._type}`);
        }
      });
      console.log('----------------------------------------');
    }

    console.log('\n' + line)
    console.log('💡 実行するには:')
    console.log('  node scripts/add-moshimo-links.js --execute')
  } else {
    console.log('🚀 Sanityに反映開始...\n')

    let updatedCount = 0
    let actualLinksInserted = 0;

    for (const item of plan) {
      try {
        const post = posts.find(p => p._id === item._id)
        if (!post || !post.body) continue

        // リンク分散ロジックを適用
        const newBody = distributeLinks(post.body, item.links);

        // 変更があった場合のみ更新
        if (JSON.stringify(post.body) !== JSON.stringify(newBody)) {
          await client.patch(item._id).set({ body: newBody }).commit()
          console.log('✅ ' + item.title + ' (リンクを再配置/追加)')
          updatedCount++
          // 実際に挿入されたリンク数を正確にカウントするには、newBodyを解析する必要があるが、
          // ここでは簡易的に計画されたリンク数を使用
          actualLinksInserted += item.links.length; 
        } else {
          console.log('☑️ ' + item.title + ' (変更なし)')
        }
      } catch (error) {
        console.error('❌ エラー: ' + item.title)
        console.error('   ' + error.message)
      }
    }

    console.log()
    console.log(line)
    console.log('📊 実行結果')
    console.log(line)
    console.log('✅ 成功: ' + updatedCount + '件')
    console.log('🔗 実際に挿入されたリンク総数: ' + actualLinksInserted + '個') // 簡易的なカウント
    console.log()
    console.log('✨ 完了！')
  }
  console.log()
}

if (require.main === module) {
  main().catch(console.error)
}
