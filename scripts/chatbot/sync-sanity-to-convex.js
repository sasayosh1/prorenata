const { createClient } = require('@sanity/client');
const { execSync } = require('child_process');

/**
 * Sanity のデータを取得し、Convex に同期する。
 * 1. Sanity から全記事取得
 * 2. キーワード抽出（正規表現ベース）
 * 3. 記事内リンク数をカウントして重要度を算出
 * 4. Convex へバルクならぬ、一件ずつまたはバッチで送信
 */

const sanityClient = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
});

function extractKeywords(title, excerpt, bodyText) {
    const keywords = new Set();

    // 1. タイトルから単語を抽出
    title.split(/[｜\s・【】（）()]/).forEach(w => {
        if (w.length >= 2) keywords.add(w);
    });

    // 2. 重要ドメイン語句
    const domainWords = ['看護助手', '夜勤', '給料', '転職', '退職', '履歴書', '面接', '資格', '介助', '仕事', '人間関係', '悩み'];
    const fullText = (title + ' ' + (excerpt || '') + ' ' + (bodyText || '')).toLowerCase();
    domainWords.forEach(word => {
        if (fullText.includes(word)) keywords.add(word);
    });

    // 3. 漢字の連続（2文字以上）をキーワードとして抽出
    const kanjiMatches = fullText.match(/[\u4e00-\u9faf]{2,}/g) || [];
    kanjiMatches.slice(0, 30).forEach(w => keywords.add(w));

    return Array.from(keywords).slice(0, 25);
}

async function sync() {
    console.log('--- Fetching data from Sanity ---');
    const query = `*[_type == "post" && !defined(internalOnly) || internalOnly == false] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    "bodyText": pt::text(body),
    "tags": tags[]
  }`;

    const posts = await sanityClient.fetch(query);
    console.log(`Fetched ${posts.length} posts.`);

    // 被リンク数（記事内リンク）の簡易集計
    const linkCounts = {};
    posts.forEach(p => {
        if (!p.bodyText) return;
        // 記事内で他の記事（/posts/slug）をリンクしている箇所を探す
        const matches = p.bodyText.match(/\/posts\/[a-zA-Z0-9_-]+/g) || [];
        matches.forEach(m => {
            const slug = m.replace('/posts/', '');
            linkCounts[slug] = (linkCounts[slug] || 0) + 1;
        });
    });

    // 重要度順にソートして上位30件を特定
    const sortedSlugs = Object.entries(linkCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .map(e => e[0]);

    console.log(`Found ${sortedSlugs.length} high-link articles to feature.`);

    let count = 0;
    for (const post of posts) {
        const keywords = extractKeywords(post.title, post.excerpt, post.bodyText);
        const featured = sortedSlugs.includes(post.slug);
        const backlinkCount = linkCounts[post.slug] || 0;

        // ConvexMutationを呼び出す（実行環境でnpx convexが使える前提）
        const args = JSON.stringify({
            url: `https://prorenata.jp/posts/${post.slug}`,
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt || '',
            keywords,
            tags: post.tags || [],
            featured,
            backlinkCount,
        });

        try {
            // 実際には一括処理の方が効率的だが、最小構成として一件ずつ実行
            execSync(`npx convex run articles:upsertArticle '${args}'`, { stdio: 'inherit' });
            count++;
        } catch (e) {
            console.error(`Failed to sync ${post.slug}`);
        }
    }

    console.log(`--- Sync completed. ${count} articles processed. ---`);
}

sync().catch(console.error);
