const fs = require('fs');
const readline = require('readline');

// JSONデータを読み込み
const articlesData = JSON.parse(fs.readFileSync('./all-articles.json', 'utf8'));

console.log('📝 記事コンテンツ検索ヘルパー');
console.log(`📊 利用可能な記事数: ${articlesData.length}\n`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function searchArticle() {
  rl.question('🔍 記事タイトルの一部を入力してください（終了: exit）: ', (searchTerm) => {
    if (searchTerm.toLowerCase() === 'exit') {
      rl.close();
      return;
    }
    
    if (!searchTerm.trim()) {
      console.log('❌ 検索語を入力してください。\n');
      searchArticle();
      return;
    }
    
    // 部分一致で検索
    const matches = articlesData.filter(article => 
      article.title && article.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (matches.length === 0) {
      console.log(`❌ "${searchTerm}" に一致する記事が見つかりません。\n`);
      searchArticle();
      return;
    }
    
    if (matches.length === 1) {
      showArticleContent(matches[0]);
    } else {
      console.log(`\n📝 ${matches.length} 件の記事が見つかりました:\n`);
      matches.forEach((article, index) => {
        console.log(`${index + 1}. "${article.title}"`);
      });
      
      rl.question('\n番号を選択してください（1-' + matches.length + '）: ', (selection) => {
        const index = parseInt(selection) - 1;
        if (index >= 0 && index < matches.length) {
          showArticleContent(matches[index]);
        } else {
          console.log('❌ 無効な選択です。\n');
          searchArticle();
        }
      });
      return;
    }
  });
}

function showArticleContent(article) {
  console.log('\n' + '='.repeat(80));
  console.log(`📰 タイトル: "${article.title}"`);
  console.log('='.repeat(80));
  
  if (article.content) {
    console.log('\n📝 コンテンツ:');
    console.log('─'.repeat(80));
    console.log(article.content);
    console.log('─'.repeat(80));
    
    // コンテンツをクリップボード用にファイルに保存
    fs.writeFileSync('./temp-content.txt', article.content);
    console.log('\n✅ コンテンツを temp-content.txt に保存しました（コピー用）');
  } else {
    console.log('\n❌ この記事にはcontentが設定されていません。');
  }
  
  console.log('\n📋 Sanity Studio での手順:');
  console.log('1. http://localhost:3333 にアクセス');
  console.log('2. Post セクションで該当記事を検索');
  console.log(`3. "${article.title}" を開いて編集`);
  console.log('4. Body フィールドに上記のコンテンツを貼り付け');
  console.log('5. 保存\n');
  
  rl.question('別の記事を検索しますか？ (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      searchArticle();
    } else {
      rl.close();
    }
  });
}

// 最初にbodyが不足しているSanity記事一覧を表示
console.log('💡 参考：bodyが不足している主な記事タイトル:');
console.log('─'.repeat(80));
const sampleTitles = [
  '看護助手の制服・ユニフォーム選び',
  '看護助手に必要な医療用語100選',
  '看護助手の1日の流れ',
  '医療現場における働き方改革推進',
  '最新感染対策ガイドライン2024',
  '看護助手標準研修プログラム改訂',
  '全国看護助手給与実態調査2024',
  '看護助手求人市場分析',
  'AI技術導入が看護助手業務',
  '電子カルテシステム統一化'
];

sampleTitles.forEach((title, index) => {
  console.log(`${index + 1}. ${title}...`);
});
console.log('─'.repeat(80));
console.log();

// 検索を開始
searchArticle();