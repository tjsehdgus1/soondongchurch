import HubPage, { type HubSearchParams } from '@/components/hub/HubPage'

export const metadata = {
    title: '전도회 | 순천순동교회',
    description: '순천순동교회 백합전도회와 남·여전도회 소식',
}

export default function Page({ searchParams }: { searchParams: HubSearchParams }) {
    return <HubPage hub="fellowship" searchParams={searchParams} />
}
