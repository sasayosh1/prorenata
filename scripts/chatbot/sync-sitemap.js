const fs = require('fs');
const path = require('path');
const http = require('http');

/**
 * sitemap.xml から記事URLを取得し、
 * ローカルの記事HTMLまたはSanityから情報を抽出し、
 * Convex に同期するスタンドアロン・スクリプト（第一歩）
 */

async function fetchSitemap() {
    // 本来は実URLから落とすが、開発中は public/sitemap.xml 等を想定
    // 無ければスタブを返すか Sanity から全件取得するパターンも検討
    const sitemapPath = path.join(process.cwd(), 'public/sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
        const xml = fs.readFileSync(sitemapPath, 'utf8');
        const urls = xml.match(/<loc>(.*?)<\/loc>/g) || [];
        return urls.map(u => u.replace(/<\/?loc>/g, '')).filter(u => u.includes('/posts/'));
    }
    return [];
}

/**
 * シンプルなキーワード抽出（日本語正規表現）
 * LLM禁止要件に基づき、名詞や重要語句を抽出
 */
function extractKeywords(text, title) {
    const keywords = new Set();

    // タイトルは絶対
    title.split(/[｜\s・]/).forEach(w => {
        if (w.length >= 2) keywords.add(w);
    });

    // ドメイン辞書（例）
    const domainSpecific = ['看護助手', '夜勤', '給料', '転職', '退職', '履歴書', '面接', '資格', '介助', '移乗'];
    domainSpecific.forEach(word => {
        if (text.includes(word)) keywords.add(word);
    });

    // 漢字の固まりを抽出
    const kanjiMatches = text.match(/[\u4e00-\u9faf]{2,}/g) || [];
    kanjiMatches.slice(0, 20).forEach(w => keywords.add(w));

    return Array.from(keywords).slice(0, 25);
}

// 実行用メイン関数
async function sync() {
    console.log('--- Starting Sitemap Refresh ---');
    const urls = await fetchSitemap();
    console.log(`Found ${urls.length} articles in sitemap.`);

    // ここで Convex への upsert コマンドを発行するロジックを組む
    // (実際には `npx convex run articles:upsertArticle` 等を叩くか、API経由で送る)
}

if (require.main === module) {
    sync();
}
