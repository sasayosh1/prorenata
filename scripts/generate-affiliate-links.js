/**
 * 楽天 + Amazon 併用アフィリエイトリンク自動生成スクリプト
 *
 * 機能:
 * - 商品名を入力するだけで楽天・Amazonの検索リンクを自動生成
 * - 実際のアソシエイトID・アフィリエイトIDを使用
 * - コピペで使える形式で出力
 */

// 設定情報
const AFFILIATE_CONFIG = {
  amazon: {
    associateId: 'ptb875pmj49-22',
    baseUrl: 'https://www.amazon.co.jp/s'
  },
  rakuten: {
    // 楽天アフィリエイトIDを設定してください
    // 例: affiliateId: '12345678.90123456.12345678.90123456'
    affiliateId: null, // 未設定の場合は通常の検索リンク
    baseUrl: 'https://search.rakuten.co.jp/search/mall'
  }
};

/**
 * URLエンコードされた商品名を取得
 */
function encodeProductName(productName) {
  return encodeURIComponent(productName);
}

/**
 * Amazonアフィリエイトリンクを生成
 */
function generateAmazonLink(productName) {
  const encodedName = encodeProductName(productName);
  return `${AFFILIATE_CONFIG.amazon.baseUrl}?k=${encodedName}&tag=${AFFILIATE_CONFIG.amazon.associateId}`;
}

/**
 * 楽天アフィリエイトリンクを生成
 */
function generateRakutenLink(productName) {
  const encodedName = encodeProductName(productName);

  if (AFFILIATE_CONFIG.rakuten.affiliateId) {
    // アフィリエイトID設定済みの場合
    return `https://hb.afl.rakuten.co.jp/hgc/${AFFILIATE_CONFIG.rakuten.affiliateId}/?pc=${AFFILIATE_CONFIG.rakuten.baseUrl}/${encodedName}/&m=http%3A%2F%2Fm.rakuten.co.jp%2F`;
  } else {
    // 未設定の場合は通常の検索リンク
    return `${AFFILIATE_CONFIG.rakuten.baseUrl}/${encodedName}/`;
  }
}

/**
 * 商品情報から完全なアフィリエイトセットを生成
 */
function generateAffiliateLinkSet(productInfo) {
  const amazonLink = generateAmazonLink(productInfo.searchTerm);
  const rakutenLink = generateRakutenLink(productInfo.searchTerm);

  return {
    productName: productInfo.name,
    searchTerm: productInfo.searchTerm,
    amazon: {
      url: amazonLink,
      displayText: 'Amazonで見る'
    },
    rakuten: {
      url: rakutenLink,
      displayText: '楽天市場で見る'
    },
    markdown: generateMarkdown(productInfo.name, amazonLink, rakutenLink),
    html: generateHtml(productInfo.name, amazonLink, rakutenLink),
    javascript: generateJavascriptObject(productInfo, amazonLink, rakutenLink)
  };
}

/**
 * Markdown形式で出力
 */
function generateMarkdown(productName, amazonLink, rakutenLink) {
  return `### ${productName}

[Amazonで見る](${amazonLink}) [PR] | [楽天市場で見る](${rakutenLink}) [PR]`;
}

/**
 * HTML形式で出力
 */
function generateHtml(productName, amazonLink, rakutenLink) {
  return `<h3>${productName}</h3>
<p>
  <a href="${amazonLink}" target="_blank" rel="nofollow noopener">Amazonで見る [PR]</a> |
  <a href="${rakutenLink}" target="_blank" rel="nofollow noopener">楽天市場で見る [PR]</a>
</p>`;
}

/**
 * JavaScript オブジェクト形式で出力（データベース用）
 */
function generateJavascriptObject(productInfo, amazonLink, rakutenLink) {
  return `{
  name: '${productInfo.name}',
  category: '${productInfo.category || '未分類'}',
  userBenefit: '${productInfo.userBenefit || ''}',
  features: ${JSON.stringify(productInfo.features || [], null, 2)},
  amazonUrl: '${amazonLink}',
  rakutenUrl: '${rakutenLink}',
  price: '${productInfo.price || ''}',
  commission: 'Amazon: 3%, 楽天: 4%'
}`;
}

/**
 * バッチ生成：複数商品を一括処理
 */
function generateBatchLinks(products) {
  console.log('=' .repeat(60));
  console.log('🔗 楽天 + Amazon アフィリエイトリンク一括生成');
  console.log('=' .repeat(60));
  console.log();

  const results = products.map(product => {
    const linkSet = generateAffiliateLinkSet(product);

    console.log(`📦 商品: ${product.name}`);
    console.log(`   検索語: ${product.searchTerm}`);
    console.log();
    console.log('【Amazon】');
    console.log(linkSet.amazon.url);
    console.log();
    console.log('【楽天】');
    console.log(linkSet.rakuten.url);
    console.log();
    console.log('【Markdown】');
    console.log(linkSet.markdown);
    console.log();
    console.log('【JavaScript】');
    console.log(linkSet.javascript);
    console.log();
    console.log('-' .repeat(60));
    console.log();

    return linkSet;
  });

  return results;
}

/**
 * 使用例：看護助手向け商品リスト
 */
const SAMPLE_PRODUCTS = [
  {
    name: 'アシックス ナースウォーカー',
    searchTerm: 'アシックス ナースウォーカー',
    category: 'ナースシューズ',
    userBenefit: '長時間の立ち仕事でも足が疲れにくい医療現場専用設計',
    features: ['滑りにくいソール', '疲労軽減クッション', '通気性の良い素材'],
    price: '6,000円前後'
  },
  {
    name: 'ミズノ メディカルシューズ',
    searchTerm: 'ミズノ メディカルシューズ',
    category: 'ナースシューズ',
    userBenefit: 'スポーツブランドの技術で足への負担を最小化',
    features: ['軽量設計', '足裏サポート', '耐久性に優れる'],
    price: '5,500円前後'
  },
  {
    name: 'ナース専用メモ帳',
    searchTerm: 'ナース メモ帳',
    category: '医療用文房具',
    userBenefit: 'ポケットに入るサイズで患者情報を素早くメモ',
    features: ['コンパクトサイズ', '防水加工', 'チェックリスト付き'],
    price: '800円前後'
  },
  {
    name: 'ステンレス医療用ハサミ',
    searchTerm: '医療用ハサミ',
    category: '医療用具',
    userBenefit: '包帯やテープのカットに最適、錆びにくく衛生的',
    features: ['ステンレス製', '先端丸型で安全', '消毒可能'],
    price: '1,200円前後'
  },
  {
    name: 'ナース専用腕時計',
    searchTerm: 'ナースウォッチ',
    category: '医療用時計',
    userBenefit: '秒針付きで脈拍測定、防水仕様で手洗いも安心',
    features: ['秒針付き', '防水仕様', '見やすい文字盤'],
    price: '3,000円前後'
  }
];

/**
 * カスタム商品のリンク生成
 */
function generateCustomLink(productName, searchTerm = null) {
  const product = {
    name: productName,
    searchTerm: searchTerm || productName
  };

  const linkSet = generateAffiliateLinkSet(product);

  console.log('=' .repeat(60));
  console.log(`🔗 ${productName} のアフィリエイトリンク`);
  console.log('=' .repeat(60));
  console.log();
  console.log('【Amazon】');
  console.log(linkSet.amazon.url);
  console.log();
  console.log('【楽天】');
  console.log(linkSet.rakuten.url);
  console.log();
  console.log('【Markdown（記事用）】');
  console.log(linkSet.markdown);
  console.log();

  return linkSet;
}

/**
 * メイン実行
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // サンプル商品で一括生成
    console.log('📋 サンプル商品でリンクを生成します\n');
    generateBatchLinks(SAMPLE_PRODUCTS);

    console.log('\n💡 使用方法:');
    console.log('  # カスタム商品のリンク生成');
    console.log('  node scripts/generate-affiliate-links.js "商品名"');
    console.log();
    console.log('  # 検索語を指定する場合');
    console.log('  node scripts/generate-affiliate-links.js "商品名" "検索語"');
    console.log();
    console.log('例:');
    console.log('  node scripts/generate-affiliate-links.js "ナースシューズ" "アシックス ナースウォーカー"');

  } else if (args.length === 1) {
    // 単一商品のリンク生成
    generateCustomLink(args[0]);

  } else {
    // 商品名と検索語を指定
    generateCustomLink(args[0], args[1]);
  }
}

// モジュールとして使用可能にする
module.exports = {
  generateAmazonLink,
  generateRakutenLink,
  generateAffiliateLinkSet,
  generateBatchLinks,
  generateCustomLink,
  AFFILIATE_CONFIG
};

// 直接実行された場合
if (require.main === module) {
  main();
}
