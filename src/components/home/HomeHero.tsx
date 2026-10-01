import SplitHeading from '@/components/motion/SplitHeading'
import Reveal from '@/components/motion/Reveal'
import MagneticButton from '@/components/motion/MagneticButton'

interface HomeHeroProps {
    title: string
    subtitle: string | null
    images: string[]
}

// 첫 화면: 사진 천천히 확대·교차 전환 + 줄 단위 제목 등장
export default function HomeHero({ title, subtitle, images }: HomeHeroProps) {
    const [first, second] = images
    const lines = title.split('\n')

    return (
        <section data-hero className="relative -mt-16 lg:-mt-20 h-[100svh] min-h-[640px] overflow-hidden bg-[#1F1D1A] text-white">
            <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={first} alt="" fetchPriority="high" className="ken-burns absolute inset-0 w-full h-full object-cover"
                    style={{ animation: 'ken-burns 16s ease-out infinite alternate' }} />
                {second && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={second} alt="" className="hero-crossfade absolute inset-0 w-full h-full object-cover"
                        style={{ animation: 'hero-crossfade 16s ease-in-out infinite, ken-burns 16s ease-out infinite alternate-reverse' }} />
                )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#1F1D1A] via-[#1F1D1A]/45 to-[#1F1D1A]/55" />

            <div className="relative h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col justify-end pb-28 lg:pb-32">
                <Reveal delay={0.2}>
                    <p className="text-xs sm:text-sm font-semibold tracking-[0.35em] uppercase text-[#D4A843] mb-6">Since 1946 · Suncheon</p>
                </Reveal>
                <SplitHeading as="h1" immediate delay={0.3} className="text-[2.6rem] leading-[1.12] sm:text-6xl lg:text-8xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
                    {lines.map((line, i) => (
                        <span key={i} className={i === lines.length - 1 ? 'block text-[#E9C46A]' : 'block'}>{line}</span>
                    ))}
                </SplitHeading>
                {subtitle && (
                    <Reveal delay={0.9} className="mt-6 max-w-xl text-base sm:text-lg text-white/80 leading-relaxed">
                        <p>{subtitle}</p>
                    </Reveal>
                )}
                <Reveal delay={1.1} className="mt-10 flex flex-wrap gap-3">
                    <MagneticButton href="/worship" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#B8860B] text-white text-sm font-semibold hover:bg-[#9A7209] transition-colors">
                        예배 안내 <span aria-hidden="true">→</span>
                    </MagneticButton>
                    <MagneticButton href="/sermons" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition-colors">
                        말씀 듣기
                    </MagneticButton>
                </Reveal>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-[10px] tracking-[0.4em] uppercase text-white/60" aria-hidden="true">
                Scroll
                <span className="scroll-line block w-px h-12 bg-white/60" style={{ animation: 'scroll-line 2.2s cubic-bezier(0.65,0,0.35,1) infinite' }} />
            </div>
        </section>
    )
}
