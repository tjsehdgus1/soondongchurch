import { pageMetadata } from '@/lib/seo'
import HubPage, { type HubSearchParams } from '@/components/hub/HubPage'

export const metadata = pageMetadata({
    title: '찬양',
    description: '순천순동교회 코람데오·늘 찬양 찬양단과 특송 영상',
    path: '/praise',
})

export default function Page({ searchParams }: { searchParams: HubSearchParams }) {
    return <HubPage hub="praise" searchParams={searchParams} />
}
