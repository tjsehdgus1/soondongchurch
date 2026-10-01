import PageHero from '@/components/site/PageHero'
import Reveal from '@/components/motion/Reveal'
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
    const byYear = groupBy(items, (i) => i.year)

    return (
        <>
            <PageHero eyebrow="History" title="걸어온 길" description="1946년 조례동의 한 가정에서 시작된 예배가 오늘의 순천순동교회가 되기까지" />

            {chapters.length > 0 && <DecadeScroller chapters={chapters} />}

            {/* 전체 연혁 */}
            <section className="py-24 lg:py-32 bg-[#FAF8F5]">
                <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10">
                    <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#B8860B] mb-12">All Records</p>
                    {items.length === 0 && <p className="text-[#A09890]">연혁을 준비 중입니다.</p>}
                    <div className="space-y-2">
                        {[...byYear.entries()].map(([year, list]: [number, TimelineItem[]]) => (
                            <Reveal key={year} className="grid grid-cols-[72px_1fr] sm:grid-cols-[140px_1fr] gap-6 border-t border-[#E8E4DE] pt-6 pb-4">
                                <p className="text-2xl sm:text-4xl font-bold text-[#B8860B] tabular-nums sm:sticky sm:top-28 self-start" style={{ fontFamily: 'var(--font-serif)' }}>{year}</p>
                                <ul className="space-y-5">
                                    {list.map((item) => (
                                        <li key={item.id} className="grid sm:grid-cols-[90px_1fr] gap-1 sm:gap-4">
                                            <span className="text-sm font-semibold text-[#8B7355] tabular-nums">{item.date_label ?? ''}</span>
                                            <div>
                                                <p className="text-[#2D2A26] leading-relaxed">{item.title}</p>
                                                {item.description && <p className="mt-1 text-sm text-[#8B7355] leading-relaxed whitespace-pre-line">{item.description}</p>}
                                                {item.image_url && (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={item.image_url} alt="" loading="lazy" className="mt-3 rounded-xl max-h-72 object-cover" />
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}
