import MagneticButton from '@/components/motion/MagneticButton'

export type HeroImage = { src: string, srcSet?: string }

interface HomeHeroProps {
    title: string
    subtitle: string | null
    images: HeroImage[]
}

// 첫 화면: 사진 천천히 확대·교차 전환 + 줄 단위 제목 등장
// 등장 효과는 CSS만 사용 → JS를 기다리지 않고 바로 그려짐 (LCP)
export default function HomeHero({ title, subtitle, images }: HomeHeroProps) {
    const [first, second] = images
    const lines = title.split('\n')

    return (
        <section data-hero className="relative -mt-16 lg:-mt-20 h-[100svh] min-h-[640px] overflow-hidden bg-[#2D2A26] text-white">
            <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={first.src} srcSet={first.srcSet} sizes="100vw" alt="" fetchPriority="high"
                    className="ken-burns absolute inset-0 w-full h-full object-cover"
                    style={{ animation: 'ken-burns 16s ease-out infinite alternate' }} />
                {second && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={second.src} srcSet={second.srcSet} sizes="100vw" alt="" loading="lazy"
                        className="hero-crossfade absolute inset-0 w-full h-full object-cover"
                        style={{ animation: 'hero-crossfade 16s ease-in-out infinite, ken-burns 16s ease-out infinite alternate-reverse' }} />
                )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#2D2A26] via-[#2D2A26]/45 to-[#2D2A26]/55" />

            <div className="relative h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col justify-end pb-20 lg:pb-24">
                <p className="hero-rise text-base sm:text-lg font-medium text-white/75 mb-5" style={{ animationDelay: '0.2s' }}>
                    1946년부터 순천과 함께
                </p>
                <h1 className="text-[2.6rem] leading-[1.12] sm:text-6xl lg:text-8xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
                    {lines.map((line, i) => (
                        <span key={i} className="block overflow-hidden pb-[0.08em]">
                            <span className="line-up block" style={{ animationDelay: `${0.3 + i * 0.12}s` }}>{line}</span>
                        </span>
                    ))}
                </h1>
                {subtitle && (
                    <p className="hero-rise mt-6 max-w-xl text-base sm:text-lg text-white/80 leading-relaxed" style={{ animationDelay: '0.8s' }}>
                        {subtitle}
                    </p>
                )}
                <div className="hero-rise mt-10 flex flex-wrap gap-3" style={{ animationDelay: '1s' }}>
                    <MagneticButton href="/worship" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-[#2D2A26] text-sm font-semibold hover:bg-[#FAF8F5] transition-colors">
                        예배 안내 <span aria-hidden="true">→</span>
                    </MagneticButton>
                    <MagneticButton href="/sermons" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition-colors">
                        말씀 듣기
                    </MagneticButton>
                </div>
            </div>

        </section>
    )
}
