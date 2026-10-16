import { pageMetadata } from '@/lib/seo'
import HubPage, { type HubSearchParams } from '@/components/hub/HubPage'

export const metadata = pageMetadata({
    title: '말씀',
    description: '순천순동교회 담임목사·협동목사·초청 설교와 선교사 말씀 영상',
    path: '/sermons',
})

export default function Page({ searchParams }: { searchParams: HubSearchParams }) {
    return <HubPage hub="sermons" searchParams={searchParams} />
}
