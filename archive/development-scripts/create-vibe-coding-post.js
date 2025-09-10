
const { createClient } = require('next-sanity')

// Sanity client configuration
const projectId = '72m8vhy2'
const dataset = 'production'
const apiVersion = '2024-01-01'
const token = process.env.SANITY_API_TOKEN // Make sure to set this environment variable

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
})

async function createVibeCodingPost() {
  if (!token) {
    console.error('Error: SANITY_API_TOKEN is not set.')
    console.error('Please set the environment variable before running this script.')
    process.exit(1)
  }

  console.log('Creating "バイブコーディングとは？" post...')

  const post = {
    _type: 'post',
    title: 'バイブコーディングとは？ プログラミングにおけるその意味と誤解',
    slug: { _type: 'slug', current: 'what-is-vibe-coding' },
    publishedAt: new Date().toISOString(),
    excerpt: '「バイブコーディング」という言葉が持つ多義性と、プログラミングの文脈で使われる際の解釈について解説します。一般的な意味合いと、技術的な側面での関連性を探ります。',
    body: [
      {
        _type: 'block',
        style: 'normal',
        children: [
          { _type: 'span', text: '「バイブコーディング」という言葉を耳にしたとき、多くの人はまず「バイブレーション（振動）」や、音楽や雰囲気といった「バイブス（Vibes）」を連想するかもしれません。しかし、プログラミングの文脈でこの言葉が使われることは、非常に稀であり、一般的な専門用語としては存在しません。' }
        ]
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: '一般的な「バイブ」の意味合い' }]
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: '「バイブ」という言葉は、文脈によって様々な意味を持ちます。' }]
      },
      {
        _type: 'block
',style: 'normal',listItem: 'bullet',level: 0,children: [{ _type: 'span', text: '**バイブレーション（Vibration）:** 物理的な振動を指します。スマートフォンやゲームコントローラーの振動機能などがこれにあたります。' }]
      },
      {
        _type: 'block
',style: 'normal',listItem: 'bullet',level: 0,children: [{ _type: 'span', text: '**バイブス（Vibes）:** 雰囲気、気分、感情、または特定の場所や人から発せられるエネルギーを指すスラングです。「良いバイブス」「悪いバイブス」といった使われ方をします。' }]
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: 'プログラミングにおける「バイブコーディング」の可能性' }]
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: 'もし仮に「バイブコーディング」という言葉がプログラミングの文脈で使われるとしたら、それは以下のような比喩的な意味合いを持つ可能性があります。' }]
      },
      {
        _type: 'block
',style: 'normal',listItem: 'number',level: 0,children: [{ _type: 'span', text: '**直感的なコーディング:** 論理的な思考だけでなく、開発者の「感覚」や「直感」に基づいてコードを書くスタイルを指すかもしれません。例えば、特定のフレームワークやライブラリの「作法」や「雰囲気」を理解し、それに合わせて自然にコードを書く、といったニュアンスです。しかし、これは「イディオマティックなコーディング」や「慣習に従ったコーディング」といった既存の言葉で表現されることがほとんどです。' }]
      },
      {
        _type: 'block
',style: 'normal',listItem: 'number',level: 0,children: [{ _type: 'span', text: '**フィードバックとしての振動:** 非常に限定的なケースですが、例えば、コードのコンパイルが成功した際にエディタが振動する、デバッグ中に特定の条件が満たされた際にデバイスが振動して通知する、といった物理的なフィードバックを指す可能性もゼロではありません。しかし、これは「ハプティックフィードバック」といった技術的な用語で表現されます。' }]
      },
      {
        _type: 'block
',style: 'normal',listItem: 'number',level: 0,children: [{ _type: 'span', text: '**チームの雰囲気:** チーム開発において、メンバー間のコミュニケーションや協力体制がスムーズで、心地よい雰囲気の中でコーディングが進む状態を指して、比喩的に「バイブコーディング」と表現する人もいるかもしれません。しかし、これは「チームワークが良い」といった表現が一般的です。' }]
      },
      {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: '結論：一般的な専門用語ではない' }]
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: '現時点では、「バイブコーディング」という言葉は、プログラミングやソフトウェア開発の分野において、**広く認知された専門用語や技術的な概念としては存在しません。** もしこの言葉を見聞きした場合は、文脈をよく確認し、比喩的な表現や特定のコミュニティ内でのスラングである可能性を考慮する必要があります。' }]
      },
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: 'プログラミングにおいては、明確なロジックと構造に基づいた「クリーンコーディング」「テスト駆動開発」「アジャイル開発」といった、確立された手法や概念が重要視されます。' }]
      }
    ],
    author: { _type: 'reference', _ref: 'aefbe415-6b34-4085-97b2-30b2aa12a6fa' }, // ProReNata編集部
    categories: [{ _type: 'reference', _ref: '56322374-a961-4512-9c81-66b3b224258b' }], // テクノロジー
  }

  try {
    const result = await client.create(post)
    console.log(`Created post: ${result.title}`)
    console.log('Successfully created the post!')
  } catch (error) {
    console.error('Error creating post:', error)
  }
}

createVibeCodingPost()
