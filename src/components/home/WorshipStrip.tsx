import Link from 'next/link'
import SplitHeading from '@/components/motion/SplitHeading'
import Reveal from '@/components/motion/Reveal'
import { nextWorship, WORSHIPS } from '@/lib/worship'

const KST_TIME = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', weekday: 'long', hour: 'numeric', minute: '2-digit' })

// 이번 주 예배: 곧 시작하는 예배 강조 + 정기 예배 5개
export default function WorshipStrip() {
    const next = nextWorship(new Date())

    return (
        <section className="py-24 lg:py-36 bg-[#FAF8F5]">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
                <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-end mb-14">
                    <div className="lg:col-span-7">
                        <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#B8860B] mb-5">Worship</p>
                        <SplitHeading className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.15] text-[#2D2A26]" style={{ fontFamily: 'var(--font-serif)' }}>
                            함께 드리는 예배는<br />가장 큰 기쁨입니다
                        </SplitHeading>
                    </div>
                    <Reveal className="lg:col-span-5">
                        <div className="rounded-2xl bg-[#1F1D1A] text-white p-7 flex items-center gap-5">
                            <span className="relative flex h-3 w-3 shrink-0" aria-hidden="true">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-[#D4A843] opacity-75 animate-ping" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D4A843]" />
                            </span>
                            <div>
                                <p className="text-xs tracking-[0.2em] text-[#D4A843] mb-1">{next.isToday ? '오늘 드리는 예배' : '다음 예배'}</p>
                                <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>{next.worship.name}</p>
                                <p className="text-sm text-white/70 mt-0.5">{KST_TIME.format(next.startsAt)}</p>
                            </div>
                        </div>
                    </Reveal>
                </div>

                <Reveal stagger className="flex lg:grid lg:grid-cols-5 gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 lg:mx-0 lg:px-0 pb-2 lg:pb-0">
                    {WORSHIPS.map((w) => {
                        const isNext = w.key === next.worship.key
                        return (
                            <div key={w.key} className="group relative shrink-0 w-[70%] sm:w-[42%] lg:w-auto snap-start aspect-[3/4] rounded-2xl overflow-hidden bg-[#2D2A26]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={w.image} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-80 transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                {isNext && <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#D4A843] text-[#1F1D1A] text-xs font-bold">다음 예배</span>}
                                <div className="absolute bottom-0 inset-x-0 p-5 text-white">
                                    <p className="text-xs tracking-[0.2em] text-white/70">{w.dayLabel}</p>
                                    <p className="text-lg font-bold mt-1" style={{ fontFamily: 'var(--font-serif)' }}>{w.name}</p>
                                    <p className="text-2xl font-extrabold mt-2 text-[#E9C46A]">{w.timeLabel}</p>
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
