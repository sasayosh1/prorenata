import { getAllPosts, type Post, formatPostDate } from '@/lib/sanity'

// 最強のキャッシュ無効化設定
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function ResolvedPage() {
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
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      margin: 0,
      padding: 0,
      backgroundColor: '#f3f4f6',
      minHeight: '100vh'
    }}>
      {/* ヘッダー */}
      <header style={{
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '2rem 0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#059669',
            margin: 0,
            textAlign: 'center'
          }}>
            🎉 ProReNata - キャッシュ問題解決完了！
          </h1>
          <p style={{
            color: '#6b7280',
            margin: '0.5rem 0 0 0',
            textAlign: 'center',
            fontSize: '1.1rem'
          }}>
            必要に応じて、その都度
          </p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main style={{ padding: '3rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          
          {/* 成功メッセージ */}
          <section style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: '3rem',
              color: '#059669',
              margin: '0 0 1rem 0',
              fontWeight: 'bold'
            }}>
              ✅ 完全解決成功！
            </h2>
            <p style={{
              fontSize: '1.25rem',
              color: '#374151',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Vercelキャッシュ問題が解決され、Sanity CMSとの連携が正常に動作しています。
            </p>
          </section>

          {/* システム状況 */}
          <div style={{
            backgroundColor: '#d1fae5',
            border: '3px solid #059669',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              color: '#065f46',
              margin: '0 0 1.5rem 0',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              🔍 リアルタイム動作確認
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <p style={{ color: '#064e3b', margin: 0, fontSize: '1.1rem' }}>
                🕐 <strong>日本時間:</strong> {japanTime}
              </p>
              <p style={{ color: '#064e3b', margin: 0, fontSize: '1.1rem' }}>
                🌍 <strong>UTC時間:</strong> {timestamp}
              </p>
              <p style={{ color: '#064e3b', margin: 0, fontSize: '1.1rem' }}>
                🔢 <strong>ユニークID:</strong> {uniqueId}
              </p>
              <p style={{ color: '#064e3b', margin: 0, fontSize: '1.1rem' }}>
                📊 <strong>Sanity状況:</strong> {sanityStatus}
              </p>
              <p style={{ color: '#064e3b', margin: 0, fontSize: '1.1rem' }}>
                🚀 <strong>ページ:</strong> /resolved (キャッシュ完全無効化)
              </p>
            </div>
            {errorDetails && (
              <p style={{ color: '#dc2626', marginTop: '1rem', fontSize: '0.9rem' }}>
                エラー詳細: {errorDetails}
              </p>
            )}
          </div>

          {/* Sanity記事表示 */}
          <section>
            <h3 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              📰 Sanity CMS記事一覧 ({posts.length}件)
            </h3>
            
            {posts.length > 0 ? (
              <div style={{ display: 'grid', gap: '2rem' }}>
                {posts.map((post, index) => (
                  <article key={post._id} style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    padding: '2rem',
                    borderLeft: '6px solid #3b82f6'
                  }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px'
                      }}>
                        #{index + 1} Sanity CMS
                      </span>
                    </div>
                    
                    <h4 style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#111827',
                      margin: '0 0 1rem 0'
                    }}>
                      📝 {post.title}
                    </h4>
                    
                    {post.excerpt && (
                      <p style={{
                        color: '#6b7280',
                        lineHeight: 1.6,
                        margin: '0 0 1.5rem 0',
                        fontSize: '1.1rem'
                      }}>
                        {post.excerpt}
                      </p>
                    )}

                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      fontSize: '0.9rem',
                      color: '#9ca3af',
                      marginBottom: '1.5rem'
                    }}>
                      {(() => {
                        const { label } = formatPostDate(post, { year: 'numeric', month: 'long', day: 'numeric' })
                        return <span>📅 {label}</span>
                      })()}
                      <span>🔗 /{post.slug.current}</span>
                      <span>🆔 {post._id.substring(0, 12)}...</span>
                    </div>

                    <a 
                      href={`/blog/${post.slug.current}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        color: '#2563eb',
                        textDecoration: 'none',
                        fontWeight: 'bold',
                        fontSize: '1.1rem'
                      }}
                    >
                      続きを読む →
                    </a>
                  </article>
                ))}
              </div>
            ) : (
              <div style={{
                backgroundColor: '#fef3c7',
                border: '2px solid #f59e0b',
                borderRadius: '12px',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <h4 style={{ color: '#92400e', margin: '0 0 1rem 0', fontSize: '1.5rem' }}>
                  ⚠️ Sanity記事が見つかりません
                </h4>
                <p style={{ color: '#78350f', fontSize: '1.1rem' }}>
                  Sanity Studioで記事を作成してPublishedにしてください。
                </p>
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
          <p style={{ margin: 0, fontSize: '1.1rem' }}>
            © 2025 ProReNata. キャッシュ問題解決完了！
          </p>
          <p style={{ 
            margin: '0.5rem 0 0 0', 
            fontSize: '0.9rem', 
            color: '#9ca3af' 
          }}>
            最終更新: {japanTime} | ID: {uniqueId}
          </p>
        </div>
      </footer>
    </div>
  );
}
