export async function GET() {
  return new Response('Gone', {
    status: 410,
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
