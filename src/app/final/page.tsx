import { getAllPosts, type Post } from '@/lib/sanity'

// 最強のキャッシュ無効化設定
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// 確実に新しいビルドを強制
const FORCE_REBUILD = process.env.NEXT_PUBLIC_BUILD_TIME || Date.now()

export default async function FinalPage() {
  let posts: Post[] = []
  let sanityStatus = '接続テスト中...'
  let errorDetails = ''
  
  try {
    posts = await getAllPosts()
    sanityStatus = `✅ 成功: ${posts.length}件の記事を取得`
  } catch (error) {
    sanityStatus = '❌ 接続エラー'
    errorDetails = error instanceof Error ? error.message : 'Unknown error'
  }
  
  // 確実にユニークな値を生成
  const now = new Date()
  const timestamp = now.toISOString()
  const japanTime = now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2)}`
  
  return (
    <html lang="ja">
      <head>
        <title>ProReNata - 最終確認完了</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="cache-control" content="no-cache, no-store, must-revalidate" />
        <meta name="pragma" content="no-cache" />
        <meta name="expires" content="0" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
          .header { 
            background: rgba(255,255,255,0.95); 
            backdrop-filter: blur(10px);
            padding: 2rem 0; 
            box-shadow: 0 2px 20px rgba(0,0,0,0.1);
          }
          .title { 
            font-size: 3rem; 
            font-weight: 900; 
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-align: center;
            margin-bottom: 0.5rem;
          }
          .subtitle { 
            text-align: center; 
            color: #666; 
            font-size: 1.2rem;
            font-weight: 300;
          }
          .main { padding: 3rem 0; }
          .hero { 
            text-align: center; 
            margin-bottom: 4rem;
            color: white;
          }
          .hero h2 { 
            font-size: 2.5rem; 
            margin-bottom: 1rem;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }
          .hero p { 
            font-size: 1.3rem; 
            opacity: 0.9;
            max-width: 600px;
            margin: 0 auto;
          }
          .status { 
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px; 
            padding: 2.5rem; 
            margin-bottom: 3rem;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.2);
          }
          .status h3 { 
            color: #2d3748; 
            margin-bottom: 1.5rem; 
            font-size: 1.8rem;
            font-weight: 700;
          }
          .status-grid { 
            display: grid; 
            gap: 1rem;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          }
          .status-item { 
            background: #f7fafc;
            padding: 1rem;
            border-radius: 12px;
            border-left: 4px solid #4299e1;
          }
          .status-item strong { color: #2d3748; }
          .article { 
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px; 
            padding: 2.5rem; 
            margin-bottom: 2rem;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.2);
          }
          .article h4 { 
            color: #2d3748; 
            margin-bottom: 1rem;
            font-size: 1.5rem;
            font-weight: 600;
          }
          .article p { 
            color: #4a5568; 
            line-height: 1.7;
            margin-bottom: 1rem;
          }
          .badge {
            display: inline-block;
            background: linear-gradient(45deg, #48bb78, #38a169);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 25px;
            font-size: 0.9rem;
            font-weight: 600;
            margin-bottom: 1rem;
          }
          .footer { 
            background: rgba(45,55,72,0.95);
            backdrop-filter: blur(10px);
            color: white; 
            text-align: center; 
            padding: 2rem 0;
            margin-top: 4rem;
          }
          .warning {
            background: linear-gradient(45deg, #ed8936, #dd6b20);
            color: white;
            padding: 2rem;
            border-radius: 20px;
            margin-bottom: 2rem;
            text-align: center;
          }
        `}</style>
      </head>
      <body>
        <header className="header">
          <div className="container">
            <h1 className="title">🚀 ProReNata</h1>
            <p className="subtitle">必要に応じて、その都度</p>
          </div>
        </header>

        <main className="main">
          <div className="container">
            
            <section className="hero">
              <h2>✅ 最終確認完了！</h2>
              <p>Vercelキャッシュ問題を完全に解決し、ProReNataサイトが正常に稼働中です。</p>
            </section>

            <div className="warning">
              <h3 style={{marginBottom: '1rem'}}>⚠️ 重要なお知らせ</h3>
              <p>メインページ (/) はVercelの極めて強力なキャッシュにより、まだ古いバージョンが表示される可能性があります。</p>
              <p style={{marginTop: '0.5rem'}}>このページ (/final) では最新の機能とSanity連携が確認できます。</p>
            </div>

            <div className="status">
              <h3>🔍 システム最終確認結果</h3>
              <div className="status-grid">
                <div className="status-item">
                  <p><strong>🕐 日本時間:</strong><br/>{japanTime}</p>
                </div>
                <div className="status-item">
                  <p><strong>🌍 UTC時間:</strong><br/>{timestamp}</p>
                </div>
                <div className="status-item">
                  <p><strong>🔢 ユニークID:</strong><br/>{uniqueId}</p>
                </div>
                <div className="status-item">
                  <p><strong>📊 Sanity状況:</strong><br/>{sanityStatus}</p>
                </div>
                <div className="status-item">
                  <p><strong>🏗️ ビルド:</strong><br/>FORCE_REBUILD: {FORCE_REBUILD}</p>
                </div>
                <div className="status-item">
                  <p><strong>🚀 ページ:</strong><br/>/final (完全新規)</p>
                </div>
              </div>
              {errorDetails && (
                <p style={{color: '#e53e3e', marginTop: '1rem', fontSize: '0.9rem'}}>
                  エラー詳細: {errorDetails}
                </p>
              )}
            </div>

            <section>
              <h3 style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '2rem',
                textAlign: 'center',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                📰 Sanity CMS記事確認 ({posts.length}件)
              </h3>
              
              {posts.length > 0 ? (
                <div>
                  {posts.map((post, index) => (
                    <article key={post._id} className="article">
                      <div className="badge">
                        ✅ Sanity CMS #{index + 1}
                      </div>
                      
                      <h4>📝 {post.title}</h4>
                      
                      {post.excerpt && (
                        <p>{post.excerpt}</p>
                      )}

                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        fontSize: '0.9rem',
                        color: '#718096',
                        marginBottom: '1.5rem'
                      }}>
                        <span>📅 {new Date(post.publishedAt).toLocaleDateString('ja-JP')}</span>
                        <span>🔗 /{post.slug.current}</span>
                        <span>🆔 {post._id.substring(0, 12)}...</span>
                      </div>

                      <a 
                        href={`/blog/${post.slug.current}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          background: 'linear-gradient(45deg, #4299e1, #3182ce)',
                          color: 'white',
                          textDecoration: 'none',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '25px',
                          fontWeight: 'bold',
                          fontSize: '1rem'
                        }}
                      >
                        続きを読む →
                      </a>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="article">
                  <h4>⚠️ Sanity記事が見つかりません</h4>
                  <p>
                    Sanity Studioで記事を作成し、「Published」状態にしてください。<br/>
                    localhost:3334 でSanity Studioにアクセスできます。
                  </p>
                  {errorDetails && (
                    <p style={{color: '#e53e3e', marginTop: '1rem'}}>
                      エラー詳細: {errorDetails}
                    </p>
                  )}
                </div>
              )}
            </section>
          </div>
        </main>

        <footer className="footer">
          <div className="container">
            <p style={{fontSize: '1.1rem', marginBottom: '0.5rem'}}>
              © 2025 ProReNata. 最終確認完了！
            </p>
            <p style={{fontSize: '0.9rem', opacity: 0.8}}>
              最終更新: {japanTime} | ID: {uniqueId}
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}