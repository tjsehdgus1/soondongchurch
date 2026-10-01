import PageHero from '@/components/site/PageHero'
import RichText from '@/components/site/RichText'
import Reveal from '@/components/motion/Reveal'
import HubSection from '@/components/hub/HubSection'
import { HUBS, type HubKey } from '@/lib/hubs'
import { getBlock } from '@/lib/content'

export type HubSearchParams = Promise<{ tab?: string, page?: string }>

// 허브 화면: 상단 소개(관리자 수정 블록) + 탭 목록
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
            {intro?.body && (
                <section className="pt-16 lg:pt-24 bg-[#FAF8F5]">
                    <Reveal className="max-w-3xl mx-auto px-4 sm:px-6">
                        <RichText html={intro.body} />
                    </Reveal>
                </section>
            )}
            <HubSection hub={hub} tab={tab} page={page} />
        </>
    )
}
