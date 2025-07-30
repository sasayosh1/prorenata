import { getAllPosts, type Post } from '@/lib/sanity'

// 最強のキャッシュ無効化
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function Home() {
  let posts: Post[] = []
  let sanityConnected = false
  let errorMessage = ''
  
  try {
    posts = await getAllPosts()
    sanityConnected = posts.length > 0
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Connection error'
  }
  
  const timestamp = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
  const buildId = Date.now()
  
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      margin: 0,
      padding: 0,
      backgroundColor: '#f9fafb',
      minHeight: '100vh'
    }}>
      {/* ヘッダー */}
      <header style={{
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '2rem 0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#111827',
            margin: 0
          }}>
            🎉 ProReNata
          </h1>
          <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0', fontSize: '1.1rem' }}>
            必要に応じて、その都度
          </p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main style={{ padding: '3rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          
          {/* ヒーロー */}
          <section style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: '3rem',
              color: '#111827',
              margin: '0 0 1rem 0',
              fontWeight: 'bold'
            }}>
              Welcome to ProReNata
            </h2>
            <p style={{
              fontSize: '1.25rem',
              color: '#6b7280',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              必要に応じて、その都度。状況に応じた最適な情報をお届けします。
            </p>
          </section>

          {/* ステータス */}
          <div style={{
            backgroundColor: sanityConnected ? '#d1fae5' : '#fef3c7',
            border: `3px solid ${sanityConnected ? '#059669' : '#f59e0b'}`,
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '3rem'
          }}>
            <h3 style={{
              color: sanityConnected ? '#065f46' : '#92400e',
              margin: '0 0 1.5rem 0',
              fontSize: '1.5rem'
            }}>
              🔍 システム状況確認
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <p style={{ color: sanityConnected ? '#064e3b' : '#78350f', margin: 0 }}>
                🕐 現在時刻: {timestamp}
              </p>
              <p style={{ color: sanityConnected ? '#064e3b' : '#78350f', margin: 0 }}>
                🔢 ビルドID: {buildId}
              </p>
              <p style={{ color: sanityConnected ? '#064e3b' : '#78350f', margin: 0 }}>
                📊 Sanity CMS: {sanityConnected ? `✅ 接続成功 (${posts.length}件)` : '❌ 接続エラー'}
              </p>
              <p style={{ color: sanityConnected ? '#064e3b' : '#78350f', margin: 0 }}>
                🚀 Vercel: ✅ デプロイ成功
              </p>
              <p style={{ color: sanityConnected ? '#064e3b' : '#78350f', margin: 0 }}>
                🔄 キャッシュ: ✅ 完全無効化
              </p>
            </div>
            {errorMessage && (
              <p style={{ color: '#dc2626', marginTop: '1rem' }}>
                エラー: {errorMessage}
              </p>
            )}
          </div>

          {/* 記事一覧 */}
          <section>
            <h3 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              📰 最新記事 ({sanityConnected ? `${posts.length}件のSanity記事` : 'テスト記事'})
            </h3>
            
            {sanityConnected ? (
              <div style={{ display: 'grid', gap: '2rem' }}>
                {posts.map((post) => (
                  <article key={post._id} style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    padding: '2rem',
                    borderLeft: '6px solid #10b981'
                  }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{
                        backgroundColor: '#d1fae5',
                        color: '#065f46',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px'
                      }}>
                        ✅ Sanity CMS
                      </span>
                    </div>
                    
                    <h4 style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#111827',
                      margin: '0 0 1rem 0'
                    }}>
                      📰 {post.title}
                    </h4>
                    
                    {post.excerpt && (
                      <p style={{
                        color: '#6b7280',
                        lineHeight: 1.6,
                        margin: '0 0 1.5rem 0'
                      }}>
                        {post.excerpt}
                      </p>
                    )}

                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      fontSize: '0.875rem',
                      color: '#9ca3af',
                      marginBottom: '1.5rem'
                    }}>
                      <span>📅 {new Date(post.publishedAt).toLocaleDateString('ja-JP')}</span>
                      <span>🔗 {post.slug.current}</span>
                    </div>

                    <a 
                      href={`/blog/${post.slug.current}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        color: '#2563eb',
                        textDecoration: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      続きを読む →
                    </a>
                  </article>
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <article style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  padding: '2rem'
                }}>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: '0 0 1rem 0' }}>
                    🎊 ProReNataへようこそ
                  </h4>
                  <p style={{ color: '#6b7280', lineHeight: 1.6, margin: '0 0 1rem 0' }}>
                    新しいブログサイトProReNataが正式に開設されました！
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                    📅 2025年7月29日
                  </p>
                </article>
                
                <article style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  padding: '2rem'
                }}>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: '0 0 1rem 0' }}>
                    🛠️ サイト構築について
                  </h4>
                  <p style={{ color: '#6b7280', lineHeight: 1.6, margin: '0 0 1rem 0' }}>
                    Next.js + Sanity CMS + Vercelで構築しました。
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                    📅 2025年7月29日
                  </p>
                </article>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* フッター */}
      <footer style={{
        backgroundColor: '#111827',
        color: '#ffffff',
        textAlign: 'center',
        padding: '2rem 0',
        marginTop: '4rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <p style={{ margin: 0 }}>© 2025 ProReNata. All rights reserved.</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#9ca3af' }}>
            更新: {timestamp} | Build: {buildId}
          </p>
        </div>
      </footer>
    </div>
  );
}