import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'オフライン | ProReNata',
    description: 'インターネット接続がありません。オフラインでも利用できる機能をご確認ください。',
    robots: 'noindex, nofollow'
}

export default function OfflineLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
