import Link from 'next/link'
import PageHero from '@/components/site/PageHero'
import RichText from '@/components/site/RichText'
import Reveal from '@/components/motion/Reveal'
import SplitHeading from '@/components/motion/SplitHeading'
import { getBlock } from '@/lib/content'
import { nextWorship, WORSHIPS } from '@/lib/worship'

export const metadata = {
    title: '예배 안내 | 순천순동교회',
    description: '순천순동교회 주일·수요·금요·새벽 예배 시간 안내',
}

export default async function WorshipPage() {
    const intro = await getBlock('worship.intro')
    const next = nextWorship(new Date())

    return (
        <>
            <PageHero
                eyebrow="예배·말씀"
                title={intro?.title ?? '함께 드리는 예배'}
                description={intro?.subtitle ?? '함께 드리는 예배는 가장 큰 기쁨입니다'}
            />

            <section className="pt-12 pb-8 lg:pt-16 lg:pb-10 bg-[#FAF8F5]">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
                    <SplitHeading className="text-4xl lg:text-5xl font-bold text-[#2D2A26] mb-10" style={{ fontFamily: 'var(--font-serif)' }}>
                        정기 예배
                    </SplitHeading>

                    {/* 표 형태의 예배 목록 — 줄에 마우스를 올리면 사진이 드러남 */}
                    <Reveal stagger className="border-t border-[#2D2A26]">
                        {WORSHIPS.map((w) => (
                            <div key={w.key} className="group relative grid grid-cols-[1fr_auto] sm:grid-cols-[140px_1fr_auto] items-center gap-4 sm:gap-8 py-7 border-b border-[#E8E4DE] overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={w.image} alt="" loading="lazy"
                                    className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-15 transition-opacity duration-700" />
                                <p className="relative hidden sm:block text-sm tracking-[0.2em] text-[#8B7355]">{w.dayLabel}</p>
                                <p className="relative text-2xl lg:text-3xl font-bold text-[#2D2A26]" style={{ fontFamily: 'var(--font-serif)' }}>
                                    {w.name}
                                    {w.key === next.worship.key && <span className="ml-3 align-middle px-2.5 py-1 rounded-full bg-[#2D2A26] text-white text-xs font-semibold">다음 예배</span>}
                                    <span className="block sm:hidden text-sm font-normal text-[#8B7355] mt-1">{w.dayLabel}</span>
                                </p>
                                <p className="relative text-2xl lg:text-4xl font-bold text-[#2D2A26] tabular-nums">{w.timeLabel}</p>
                            </div>
                        ))}
                    </Reveal>
                </div>
            </section>

            {intro?.body && (
                <section className="pb-16 bg-[#FAF8F5]">
                    <Reveal className="max-w-3xl mx-auto px-4 sm:px-6">
                        <RichText html={intro.body} />
                    </Reveal>
                </section>
            )}

            {/* 주보·말씀 바로가기 — 위 목록에 바로 이어지게 (위쪽 여백 없음) */}
            <section className="pb-12 lg:pb-16 bg-[#FAF8F5]">
                <Reveal stagger className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 grid md:grid-cols-2 gap-3 md:gap-6">
                    <Link href="/bulletins" className="group flex items-center justify-between gap-4 rounded-2xl bg-[#2D2A26] text-white px-6 py-5 lg:px-8 lg:py-7 hover:-translate-y-1 transition-transform duration-500">
                        <span>
                            <span className="block text-2xl lg:text-3xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>주보 보기</span>
                            <span className="block mt-1 text-sm text-white/60">이번 주 예배 순서와 교회 소식</span>
                        </span>
                        <span aria-hidden="true" className="text-xl transition-transform group-hover:translate-x-1">→</span>
                    </Link>
                    <Link href="/sermons" className="group flex items-center justify-between gap-4 rounded-2xl bg-white border border-[#E8E4DE] text-[#2D2A26] px-6 py-5 lg:px-8 lg:py-7 hover:-translate-y-1 transition-transform duration-500">
                        <span>
                            <span className="block text-2xl lg:text-3xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>말씀 다시 듣기</span>
                            <span className="block mt-1 text-sm text-[#8B7355]">담임목사·협동목사·초청 설교 영상</span>
                        </span>
                        <span aria-hidden="true" className="text-xl transition-transform group-hover:translate-x-1">→</span>
                    </Link>
                </Reveal>
            </section>
        </>
    )
}
