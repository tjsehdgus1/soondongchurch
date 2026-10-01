import MagneticButton from '@/components/motion/MagneticButton'

export type HeroImage = { src: string, srcSet?: string }

interface HomeHeroProps {
    title: string
    // 제목 위 표어 (관리자 수정)
    subtitle: string | null
    images: HeroImage[]
    // 로그인하지 않았을 때만 '회원가입하기' 버튼
    showRegister: boolean
}

const YOUTUBE_URL = 'https://www.youtube.com/@%EC%88%9C%EC%B2%9C%EC%88%9C%EB%8F%99%EA%B5%90%ED%9A%8C'
const MOTTOS = ['예배가 살아있는 교회', '기도가 살아있는 교회', '선교가 살아있는 교회']

// 첫 화면: 사진 천천히 확대·교차 전환 + 가운데 정렬 표어·제목 (리디자인 전 운영 사이트 구성)
// 등장 효과는 CSS만 사용 → JS를 기다리지 않고 바로 그려짐 (LCP)
export default function HomeHero({ title, subtitle, images, showRegister }: HomeHeroProps) {
    const [first, second] = images
    const lines = title.split('\n')

    return (
        <section data-hero className="relative -mt-16 lg:-mt-20 min-h-[90svh] flex items-center justify-center overflow-hidden bg-[#2D2A26] text-white">
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
            <div className="absolute inset-0 bg-[#2D2A26]/45" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2D2A26] via-[#2D2A26]/40 to-[#2D2A26]/20" />

            <div className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-32 pb-24 text-center">
                {subtitle && (
                    <p className="hero-rise inline-flex items-center gap-2 px-5 py-2.5 mb-8 rounded-full border border-white/25 bg-white/10 backdrop-blur-md text-sm font-medium" style={{ animationDelay: '0.1s' }}>
                        <span aria-hidden="true" className="text-white/80">✝</span>
                        {subtitle}
                    </p>
                )}
                <h1 className="text-4xl leading-[1.2] sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
                    {lines.map((line, i) => (
                        <span key={i} className="block overflow-hidden pb-[0.08em]">
                            <span className="line-up block" style={{ animationDelay: `${0.3 + i * 0.12}s` }}>{line}</span>
                        </span>
                    ))}
                </h1>
                <ul className="hero-rise mt-8 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-0 text-lg md:text-2xl font-bold text-white/90" style={{ animationDelay: '0.7s' }}>
                    {MOTTOS.map((motto, i) => (
                        <li key={motto} className="flex items-center">
                            {i > 0 && <span aria-hidden="true" className="hidden md:inline mx-5 h-5 w-px bg-white/40" />}
                            {motto}
                        </li>
                    ))}
                </ul>
                <div className="hero-rise mt-12 flex flex-col sm:flex-row gap-3 justify-center" style={{ animationDelay: '0.9s' }}>
                    <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-red-600 text-white text-base font-semibold hover:bg-red-700 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z" /></svg>
                        순동교회 유튜브
                    </a>
                    {showRegister && (
                        <MagneticButton href="/auth/register" className="inline-flex items-center justify-center px-7 py-3.5 rounded-full border border-white/40 bg-white/10 backdrop-blur-md text-white text-base font-semibold hover:bg-white/20 transition-colors">
                            회원가입하기
                        </MagneticButton>
                    )}
                </div>
            </div>
        </section>
    )
}
