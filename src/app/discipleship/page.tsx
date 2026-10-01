import HubPage, { type HubSearchParams } from '@/components/hub/HubPage'

export const metadata = {
    title: '양육 | 순천순동교회',
    description: '순천순동교회 새가족반과 제자대학 소식',
}

export default function Page({ searchParams }: { searchParams: HubSearchParams }) {
    return <HubPage hub="discipleship" searchParams={searchParams} />
}
