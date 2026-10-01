import Link from 'next/link'
import PageHero from '@/components/site/PageHero'
import Reveal from '@/components/motion/Reveal'
import SplitHeading from '@/components/motion/SplitHeading'
import { getPeople, type Person } from '@/lib/content'

export const metadata = {
    title: '섬기는 분들 | 순천순동교회',
    description: '순천순동교회 교역자와 역대 담임교역자',
}

const PASTOR_HISTORY = '역대 담임교역자'

export default async function PeoplePage() {
    const { items, hiddenCategories } = await getPeople()
    const pastors = items.filter((p) => p.category === PASTOR_HISTORY)

    // 구분별 묶음 (등록 순서 유지)
    const groups = new Map<string, Person[]>()
    for (const p of items) {
        if (p.category === PASTOR_HISTORY) continue
        groups.set(p.category, [...(groups.get(p.category) ?? []), p])
    }

    return (
        <>
            <PageHero eyebrow="People" title="섬기는 분들" description="하나님과 교회를 섬기는 귀한 분들을 소개합니다" />

            {pastors.length > 0 && (
                <section className="py-24 lg:py-32 bg-white">
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 grid lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-4">
                            <div className="lg:sticky lg:top-32">
                                <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#B8860B] mb-5">Pastors</p>
                                <SplitHeading className="text-4xl lg:text-5xl font-bold text-[#2D2A26]" style={{ fontFamily: 'var(--font-serif)' }}>
                                    역대 담임교역자
                                </SplitHeading>
                                <p className="mt-5 text-[#8B7355]">1948년부터 순동교회를 섬긴 {pastors.length}분의 교역자</p>
                            </div>
                        </div>
                        <Reveal stagger className="lg:col-span-7 lg:col-start-6 relative border-l border-[#E8E4DE] pl-8 space-y-8">
                            {pastors.map((p, i) => {
                                const current = i === pastors.length - 1
                                return (
                                    <div key={p.id} className="relative">
                                        <span className={`absolute -left-[37px] top-2 w-[9px] h-[9px] rounded-full ${current ? 'bg-[#2D2A26] ring-4 ring-[#2D2A26]/15' : 'bg-[#C8C2B8]'}`} />
                                        <p className="text-sm text-[#8B7355] tabular-nums">{p.period}</p>
                                        <p className={`mt-1 text-xl font-bold text-[#2D2A26]`} style={{ fontFamily: 'var(--font-serif)' }}>
                                            {p.name} <span className="text-base font-normal text-[#8B7355]">{p.role}</span>
                                        </p>
                                    </div>
                                )
                            })}
                        </Reveal>
                    </div>
                </section>
            )}

            {(groups.size > 0 || hiddenCategories.length > 0) && (
                <section className="py-24 lg:py-32 bg-[#FAF8F5]">
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 space-y-20">
                        {[...groups.entries()].map(([category, people]) => (
                            <div key={category}>
                                <h2 className="text-2xl lg:text-3xl font-bold text-[#2D2A26] mb-8 pb-4 border-b border-[#2D2A26]" style={{ fontFamily: 'var(--font-serif)' }}>
                                    {category}
                                </h2>
                                <Reveal stagger className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
                                    {people.map((p) => (
                                        <figure key={p.id} className="group">
                                            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-[#E8E4DE]">
                                                {p.photo_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={p.photo_url} alt={p.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-3xl text-[#C8C2B8]" aria-hidden="true">✝</div>
                                                )}
                                            </div>
                                            <figcaption className="mt-3 text-center">
                                                <span className="font-semibold text-[#2D2A26]">{p.name}</span>
                                                {p.role && <span className="block text-xs text-[#8B7355]">{p.role}</span>}
                                            </figcaption>
                                        </figure>
                                    ))}
                                </Reveal>
                            </div>
                        ))}

                        {hiddenCategories.length > 0 && (
                            <Reveal className="rounded-3xl bg-[#2D2A26] text-white p-10 lg:p-14 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                <div>
                                    <p className="text-xs tracking-[0.3em] uppercase text-white/60 mb-4">Members only</p>
                                    <p className="text-2xl lg:text-3xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>교인 사진은 로그인하면 볼 수 있어요</p>
                                    <p className="mt-3 text-sm text-white/60">{hiddenCategories.join(' · ')}</p>
                                </div>
                                <Link href="/auth/login" className="shrink-0 px-7 py-3.5 rounded-full bg-white text-[#2D2A26] text-sm font-semibold hover:bg-[#FAF8F5] transition-colors self-start lg:self-auto">
                                    로그인
                                </Link>
                            </Reveal>
                        )}
                    </div>
                </section>
            )}
        </>
    )
}
