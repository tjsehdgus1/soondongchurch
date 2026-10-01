import MissionExperience from '@/components/mission/MissionExperience'
import HubSection from '@/components/hub/HubSection'
import RichText from '@/components/site/RichText'
import Reveal from '@/components/motion/Reveal'
import SplitHeading from '@/components/motion/SplitHeading'
import type { HubSearchParams } from '@/components/hub/HubPage'
import { getBlock, getMissionFields } from '@/lib/content'

export const metadata = {
    title: '선교 | 순천순동교회',
    description: '순천에서 땅 끝까지 — 순천순동교회가 함께하는 선교지와 선교 이야기',
}

export default async function MissionPage({ searchParams }: { searchParams: HubSearchParams }) {
    const { tab, page } = await searchParams
    const [intro, fields] = await Promise.all([getBlock('mission.intro'), getMissionFields()])

    return (
        <>
            <MissionExperience fields={fields} title={intro?.title ?? '땅 끝까지 이르러'} subtitle={intro?.subtitle ?? '사도행전 1:8'} />

            <section className="py-24 lg:py-32 bg-[#FAF8F5]">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
                    <div className="grid lg:grid-cols-12 gap-10 mb-16">
                        <div className="lg:col-span-5">
                            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#B8860B] mb-5">Fields</p>
                            <SplitHeading className="text-4xl lg:text-5xl font-bold text-[#2D2A26]" style={{ fontFamily: 'var(--font-serif)' }}>
                                함께 기도하는 선교지
                            </SplitHeading>
                        </div>
                        {intro?.body && (
                            <Reveal className="lg:col-span-6 lg:col-start-7">
                                <RichText html={intro.body} />
                            </Reveal>
                        )}
                    </div>
                    <Reveal stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {fields.map((f) => (
                            <article key={f.id} className="rounded-3xl bg-white border border-[#E8E4DE] overflow-hidden">
                                {f.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={f.image_url} alt="" loading="lazy" className="w-full aspect-[4/3] object-cover" />
                                ) : (
                                    <div className="aspect-[4/3] bg-[radial-gradient(circle_at_30%_30%,#3a352f,#1F1D1A)] flex items-end p-6">
                                        <span className="text-5xl font-bold text-[#E9C46A]/80" style={{ fontFamily: 'var(--font-serif)' }}>{f.country.slice(0, 2)}</span>
                                    </div>
                                )}
                                <div className="p-6">
                                    <p className="text-xs tracking-[0.25em] text-[#B8860B]">{f.region}</p>
                                    <p className="text-xl font-bold text-[#2D2A26] mt-1" style={{ fontFamily: 'var(--font-serif)' }}>{f.country}</p>
                                    {f.missionaries && <p className="mt-2 text-sm text-[#5C5650]">{f.missionaries}</p>}
                                    {f.summary && <p className="mt-2 text-sm text-[#8B7355] leading-relaxed">{f.summary}</p>}
                                </div>
                            </article>
                        ))}
                    </Reveal>
                </div>
            </section>

            <div id="stories" className="scroll-mt-24">
                <HubSection hub="mission" tab={tab} page={page} />
            </div>
        </>
    )
}
