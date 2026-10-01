import PageHero from '@/components/site/PageHero'
import DecadeScroller, { type DecadeChapter } from '@/components/about/DecadeScroller'
import { getTimeline, type TimelineItem } from '@/lib/content'

export const metadata = {
    title: '걸어온 길 | 순천순동교회',
    description: '1946년 순천해촌교회 설립부터 오늘까지 순천순동교회의 연혁',
}

function groupBy<T, K>(items: T[], keyOf: (item: T) => K): Map<K, T[]> {
    const map = new Map<K, T[]>()
    for (const item of items) {
        const key = keyOf(item)
        map.set(key, [...(map.get(key) ?? []), item])
    }
    return map
}

export default async function HistoryPage() {
    const items = await getTimeline()
    const byDecade = groupBy(items, (i) => Math.floor(i.year / 10) * 10)
    const chapters: DecadeChapter[] = [...byDecade.entries()].map(([decade, list]) => ({
        decade,
        count: list.length,
        highlights: list.slice(0, 3).map((i) => ({ year: i.year, title: i.title })),
    }))

    return (
        <>
            <PageHero eyebrow="교회소개" title="걸어온 길" description="1946년 조례동의 한 가정에서 시작된 예배가 오늘의 순천순동교회가 되기까지" />

            {chapters.length > 0 && <DecadeScroller chapters={chapters} />}

            {/* 전체 연혁: 연대별로 접어 두고 필요한 연대만 펼쳐 보기 */}
            <section className="py-16 lg:py-20 bg-[#FAF8F5]">
                <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10">
                    <h2 className="text-3xl lg:text-4xl font-bold text-[#2D2A26] mb-8" style={{ fontFamily: 'var(--font-serif)' }}>연도별 기록</h2>
                    {items.length === 0 && <p className="text-[#A09890]">연혁을 준비 중입니다.</p>}
                    <div className="border-t border-[#2D2A26]">
                        {[...byDecade.entries()].map(([decade, list]) => (
                            <details key={decade} className="group border-b border-[#E8E4DE]">
                                <summary className="flex items-center justify-between gap-4 py-6 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                                    <span className="text-2xl lg:text-3xl font-bold text-[#2D2A26]" style={{ fontFamily: 'var(--font-serif)' }}>
                                        {decade}년대 <span className="ml-2 text-base font-normal text-[#8B7355]">{list.length}건</span>
                                    </span>
                                    <span className="text-2xl text-[#2D2A26] transition-transform duration-300 group-open:rotate-45" aria-hidden="true">+</span>
                                </summary>
                                <div className="pb-8 space-y-6">
                                    {[...groupBy(list, (i) => i.year).entries()].map(([year, yearItems]: [number, TimelineItem[]]) => (
                                        <div key={year} className="grid grid-cols-[64px_1fr] sm:grid-cols-[110px_1fr] gap-4 sm:gap-6">
                                            <p className="text-xl sm:text-2xl font-bold text-[#2D2A26] tabular-nums" style={{ fontFamily: 'var(--font-serif)' }}>{year}</p>
                                            <ul className="space-y-4">
                                                {yearItems.map((item) => (
                                                    <li key={item.id} className="grid sm:grid-cols-[90px_1fr] gap-1 sm:gap-4">
                                                        <span className="text-sm font-semibold text-[#8B7355] tabular-nums">{item.date_label ?? ''}</span>
                                                        <div>
                                                            <p className="text-[#2D2A26] leading-relaxed">{item.title}</p>
                                                            {item.description && <p className="mt-1 text-[#8B7355] leading-relaxed whitespace-pre-line">{item.description}</p>}
                                                            {item.image_url && (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img src={item.image_url} alt="" loading="lazy" className="mt-3 rounded-xl max-h-72 object-cover" />
                                                            )}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}
