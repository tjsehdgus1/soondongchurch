import HubPage, { type HubSearchParams } from '@/components/hub/HubPage'

export const metadata = {
    title: '찬양 | 순천순동교회',
    description: '순천순동교회 코람데오·늘 찬양 찬양단과 특송 영상',
}

export default function Page({ searchParams }: { searchParams: HubSearchParams }) {
    return <HubPage hub="praise" searchParams={searchParams} />
}
