import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SeraAdviceBubble from '@/components/SeraAdviceBubble'

export default function TestBubblePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />
      
      <main className="max-w-4xl mx-auto py-20 px-6">
        <div className="text-center mb-16">
          <h1 className="text-3xl font-black mb-4">Sera Advice Bubble Sample</h1>
          <p className="text-gray-500">記事内で使用する「セラの助言」コンポーネントの試作です。</p>
        </div>

        <section className="prose-custom mb-12">
          <h2>サンプル：面接対策の記事での活用イメージ</h2>
          <p>
            面接準備をしていると、どうしても「正解」を探してしまって、自分の言葉が分からなくなることがあります。
            そんな時、わたしから一つだけ、はっきりとお伝えしたいことがあります。
          </p>
        </section>

        {/* The New Component */}
        <SeraAdviceBubble 
          content="志望動機で迷っているなら、わたしは『自分の実体験』を一つ添える道を選びます。&#10;なぜなら、テンプレート通りの言葉よりも、あなたの不器用な本音の方がずっと面接官の心に届くからです。&#10;その方が、入職後のミスマッチも防げて長い目で見てプラスになりますよ。" 
        />

        <section className="prose-custom mt-12 bg-gray-50 dark:bg-gray-900/50 p-8 rounded-2xl border border-gray-100 dark:border-gray-800">
          <h3 className="mt-0">こだわったポイント</h3>
          <ul>
            <li><strong>決定的な助言</strong>：優柔不断な表現を避け、セラの視点から「こちらが正解」とはっきり提示する形式にしました。</li>
            <li><strong>アイコンの存在感</strong>：指定いただいた高解像度のアイコンを使い、信頼感のあるデザインにしています。</li>
            <li><strong>視認性</strong>：吹き出しの背景を白（またはダークモード用のグレー）にし、前後の本文と明確に区別できるようにしました。</li>
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  )
}
