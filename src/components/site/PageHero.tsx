import SplitHeading from '@/components/motion/SplitHeading'
import Reveal from '@/components/motion/Reveal'

interface PageHeroProps {
    eyebrow: string
    title: string
    description?: string | null
    // 있으면 헤더 아래까지 덮는 시네마틱 배경 (헤더 투명 처리)
    image?: string | null
    children?: React.ReactNode
}

// 하위 페이지 공통 상단
export default function PageHero({ eyebrow, title, description, image, children }: PageHeroProps) {
    if (image) {
        return (
            <section data-hero className="relative -mt-16 lg:-mt-20 min-h-[70vh] flex items-end overflow-hidden bg-[#2D2A26] text-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" className="ken-burns absolute inset-0 w-full h-full object-cover opacity-70"
                    style={{ animation: 'ken-burns 14s ease-out forwards' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2D2A26] via-[#2D2A26]/40 to-[#2D2A26]/30" />
                <div className="relative max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-10 pb-16 pt-40">
                    <p className="text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-white/60 mb-5">{eyebrow}</p>
                    <SplitHeading as="h1" immediate className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] max-w-4xl" style={{ fontFamily: 'var(--font-serif)' }}>
                        {title}
                    </SplitHeading>
                    {description && (
                        <Reveal delay={0.4} className="mt-6 max-w-2xl text-base sm:text-lg text-white/80 leading-relaxed">
                            <p>{description}</p>
                        </Reveal>
                    )}
                    {children}
                </div>
            </section>
        )
    }

    return (
        <section className="bg-[#FAF8F5] border-b border-[#E8E4DE]">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-16 pb-14 lg:pt-24 lg:pb-20">
                <p className="text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-[#B8860B] mb-5">{eyebrow}</p>
                <SplitHeading as="h1" immediate className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] text-[#2D2A26] max-w-4xl" style={{ fontFamily: 'var(--font-serif)' }}>
                    {title}
                </SplitHeading>
                {description && (
                    <Reveal delay={0.3} className="mt-6 max-w-2xl text-base sm:text-lg text-[#5C5650] leading-relaxed">
                        <p>{description}</p>
                    </Reveal>
                )}
                {children}
            </div>
        </section>
    )
}
