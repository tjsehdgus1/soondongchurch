import { pageMetadata } from '@/lib/seo'
import HubPage, { type HubSearchParams } from '@/components/hub/HubPage'

export const metadata = pageMetadata({
    title: '다음세대',
    description: '순천순동교회 유아 유치반부터 청년회까지 다음세대 소식',
    path: '/next-gen',
})

export default function Page({ searchParams }: { searchParams: HubSearchParams }) {
    return <HubPage hub="next-gen" searchParams={searchParams} />
}
