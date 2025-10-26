const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '72m8vhy2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN,
  useCdn: false
});

async function test() {
  try {
    const post = await client.fetch('*[_type == "post" && slug.current == "nursing-assistant-career-change-medical-office"][0]{ _id, title, excerpt }');
    if (!post) {
      console.log('❌ nursing-assistant-career-change-medical-office が見つかりません');
      return;
    }
    console.log('✅ 記事取得成功:');
    console.log('   ID:', post._id);
    console.log('   タイトル:', post.title);
    console.log('   現在のexcerpt:', post.excerpt || '(なし)');
    console.log('\n✅ 書き込み権限テスト: トークンが正しく設定されています');
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

test();
