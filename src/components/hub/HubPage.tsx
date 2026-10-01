import PageHero from '@/components/site/PageHero'
import HubSection from '@/components/hub/HubSection'
import { HUBS, type HubKey } from '@/lib/hubs'
import { getBlock } from '@/lib/content'

export type HubSearchParams = Promise<{ tab?: string, page?: string }>

// 허브 화면: 얇은 상단 띠(관리자 수정 블록의 제목·부제·사진) + 탭 목록
export default async function HubPage({ hub, searchParams, heroImage }: { hub: HubKey, searchParams: HubSearchParams, heroImage?: string }) {
    const { tab, page } = await searchParams
    const { title, eyebrow, introKey } = HUBS[hub]
    const intro = introKey ? await getBlock(introKey) : null

    return (
        <>
            <PageHero
                eyebrow={eyebrow}
                title={intro?.title ?? title}
                description={intro?.subtitle}
                image={intro?.image_url ?? heroImage}
            />
            <HubSection hub={hub} tab={tab} page={page} />
        </>
    )
}
