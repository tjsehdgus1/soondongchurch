import Link from 'next/link'
import SplitHeading from '@/components/motion/SplitHeading'
import Reveal from '@/components/motion/Reveal'
import { nextWorship, WORSHIPS } from '@/lib/worship'

const KST_TIME = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', weekday: 'long', hour: 'numeric', minute: '2-digit' })

// 이번 주 예배: 곧 시작하는 예배 강조 + 정기 예배 5개
export default function WorshipStrip() {
    const next = nextWorship(new Date())

    return (
        <section className="py-16 lg:py-24 bg-[#FAF8F5]">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
                <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-end mb-10">
                    <div className="lg:col-span-7">
                        <SplitHeading className="text-4xl sm:text-5xl font-bold leading-[1.2] text-[#2D2A26]" style={{ fontFamily: 'var(--font-serif)' }}>
                            함께 드리는 예배는<br />가장 큰 기쁨입니다
                        </SplitHeading>
                    </div>
                    <Reveal className="lg:col-span-5">
                        <div className="border-l-2 border-[#2D2A26] pl-6">
                            <p className="text-base text-[#8B7355]">{next.isToday ? '오늘 드리는 예배' : '다음 예배'}</p>
                            <p className="mt-1 text-2xl font-bold text-[#2D2A26]" style={{ fontFamily: 'var(--font-serif)' }}>{next.worship.name}</p>
                            <p className="mt-1 text-lg text-[#5C5650]">{KST_TIME.format(next.startsAt)}</p>
                        </div>
                    </Reveal>
                </div>

                {/* 좁은 화면: 옆으로 넘기는 띠 — 화면 끝까지 넘기되, 카드는 본문 좌우 여백(scroll-px)에 맞춰 멈춤 */}
                <Reveal stagger className="flex lg:grid lg:grid-cols-5 gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 scroll-px-4 sm:-mx-6 sm:px-6 sm:scroll-px-6 lg:mx-0 lg:px-0 lg:scroll-px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {WORSHIPS.map((w) => {
                        const isNext = w.key === next.worship.key
                        return (
                            <div key={w.key} className="group relative shrink-0 w-[70%] sm:w-[42%] lg:w-auto snap-start aspect-[3/4] rounded-2xl overflow-hidden bg-[#2D2A26] ring-1 ring-black/5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={w.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#171512]/90 via-[#171512]/25 via-45% to-[#171512]/5" />
                                {isNext && <span className="absolute left-4 top-4 rounded-full border border-white/30 bg-[#FAF8F5] px-3 py-1 text-xs font-semibold text-[#2D2A26]">다음 예배</span>}
                                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                                    <p className="text-sm text-white/75">{w.dayLabel}</p>
                                    <p className="mt-1 text-lg font-bold" style={{ fontFamily: 'var(--font-serif)' }}>{w.name}</p>
                                    <p className="mt-2 text-2xl font-bold text-white">{w.timeLabel}</p>
                                </div>
                            </div>
                        )
                    })}
                </Reveal>

                <div className="mt-10 text-right">
                    <Link href="/worship" className="text-sm font-medium text-[#8B7355] hover:text-[#B8860B] underline-offset-4 hover:underline">예배 안내 자세히 →</Link>
                </div>
            </div>
        </section>
    )
}
