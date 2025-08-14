import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const title = searchParams.get('title') || 'ProReNata'
    const subtitle = searchParams.get('subtitle') || '看護助手向け情報サイト'
    const category = searchParams.get('category') || ''
    const readingTime = searchParams.get('readingTime') || '5'

    // Inter font from Google Fonts
    const interSemiBold = fetch(
      'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
    ).then((res) => res.arrayBuffer()).catch(() => null)
    
    const interRegular = fetch(
      'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeAZ9hiA.woff2'
    ).then((res) => res.arrayBuffer()).catch(() => null)

    const [interSemiBoldData, interRegularData] = await Promise.all([
      interSemiBold,
      interRegular
    ])

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            backgroundImage: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f0fdf4 100%)',
            padding: '80px',
            fontFamily: 'Inter',
          }}
        >
          {/* ヘッダー */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '15px',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '20px',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                style={{ color: 'white' }}
              >
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#0f172a',
                  marginBottom: '4px',
                }}
              >
                ProReNata
              </div>
              <div
                style={{
                  fontSize: '18px',
                  color: '#64748b',
                }}
              >
                Pro Re Nata - 必要に応じて、その都度
              </div>
            </div>
          </div>

          {/* メインタイトル */}
          <div
            style={{
              fontSize: title.length > 50 ? '48px' : '56px',
              fontWeight: '700',
              color: '#0f172a',
              lineHeight: '1.2',
              marginBottom: '24px',
              maxWidth: '900px',
            }}
          >
            {title}
          </div>

          {/* サブタイトル */}
          {subtitle !== '看護助手向け情報サイト' && (
            <div
              style={{
                fontSize: '24px',
                color: '#334155',
                lineHeight: '1.5',
                marginBottom: '32px',
                maxWidth: '800px',
              }}
            >
              {subtitle}
            </div>
          )}

          {/* メタ情報 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              marginTop: 'auto',
            }}
          >
            {category && (
              <div
                style={{
                  background: '#e0f2fe',
                  color: '#0284c7',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '16px',
                  fontWeight: '500',
                }}
              >
                {category}
              </div>
            )}
            
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                color: '#64748b',
                fontSize: '16px',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                style={{ marginRight: '8px' }}
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2"/>
              </svg>
              約{readingTime}分で読める
            </div>
          </div>

          {/* 装飾要素 */}
          <div
            style={{
              position: 'absolute',
              top: '40px',
              right: '40px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e20 0%, #0ea5e920 100%)',
            }}
          />
          
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              right: '80px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0ea5e920 0%, #22c55e20 100%)',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          ...(interSemiBoldData ? [{
            name: 'Inter',
            data: interSemiBoldData,
            weight: 600 as const,
            style: 'normal' as const,
          }] : []),
          ...(interRegularData ? [{
            name: 'Inter',
            data: interRegularData,
            weight: 400 as const,
            style: 'normal' as const,
          }] : []),
        ],
      }
    )
  } catch (e: unknown) {
    console.log(`Failed to generate OG image: ${e instanceof Error ? e.message : 'Unknown error'}`)
    return new Response(`Failed to generate OG image`, {
      status: 500,
    })
  }
}