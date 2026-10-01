import Reveal from '@/components/motion/Reveal'
import SplitHeading from '@/components/motion/SplitHeading'
import MagneticButton from '@/components/motion/MagneticButton'

// 오시는 길 띠
export default function VisitBand() {
    return (
        <section className="bg-[#F2EFE9] text-[#2D2A26] border-t border-[#E8E4DE]">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-24 lg:py-28 grid lg:grid-cols-2 gap-10 items-end">
                <div>
                    <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#B8860B] mb-5">Visit</p>
                    <SplitHeading className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.15]" style={{ fontFamily: 'var(--font-serif)' }}>
                        언제든 오세요,<br />함께 예배해요
                    </SplitHeading>
                </div>
                <Reveal className="lg:text-right space-y-6">
                    <div className="space-y-1 text-[#5C5650]">
                        <p className="text-lg font-semibold text-[#2D2A26]">전라남도 순천시 남신월 4길 3-13</p>
                        <p>주일오전예배 11:00 · 수요밤예배 19:00 · 새벽예배 05:00</p>
                        <p>Tel 061-721-6707</p>
                    </div>
                    <div className="flex flex-wrap gap-3 lg:justify-end">
                        <MagneticButton href="/directions" className="px-7 py-3.5 rounded-full bg-[#2D2A26] text-white text-sm font-semibold hover:bg-black transition-colors">
                            오시는 길 →
                        </MagneticButton>
                        <MagneticButton href="/about" className="px-7 py-3.5 rounded-full border border-[#2D2A26]/20 text-[#2D2A26] text-sm font-semibold hover:bg-white transition-colors">
                            교회 소개
                        </MagneticButton>
                    </div>
                </Reveal>
            </div>
        </section>
    )
}
