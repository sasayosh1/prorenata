import { SITE_URL } from '@/lib/constants'

// robots.txt API route

export async function GET() {
  const baseUrl = SITE_URL
  
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /api
Disallow: /api/
Disallow: /studio/
Disallow: /_next/

Sitemap: ${baseUrl}/sitemap.xml
`

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
    }
  })
}
