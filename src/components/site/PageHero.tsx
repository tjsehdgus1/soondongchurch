interface PageHeroProps {
    // 메뉴 위치 (예: 교회소개) — 제목과 같으면 표시하지 않음
    eyebrow: string
    title: string
    // 한 줄 소개 (길면 한 줄로 자름)
    description?: string | null
    // 배경 사진 (없으면 메뉴별 기본 사진)
    image?: string | null
}

// 메뉴별 기본 배경 (2400/1200px webp)
const DEFAULT_IMAGE: Record<string, string> = {
    '교회소개': '/images/hero-bg-2',
    '예배·말씀': '/images/hero-bg-1',
    '다음세대': '/images/hero-bg-1',
    '선교·사역': '/images/hero-bg-2',
    '소식·나눔': '/images/hero-bg-1',
}

// 하위 페이지 상단: 얇은 사진 띠 + 제목 (헤더 아래까지 덮고 헤더는 투명 처리)
export default function PageHero({ eyebrow, title, description, image }: PageHeroProps) {
    const base = DEFAULT_IMAGE[eyebrow] ?? '/images/hero-bg-1'
    const src = image ?? `${base}.webp`
    const srcSet = image ? undefined : `${base}-sm.webp 1200w, ${base}.webp 2400w`

    return (
        <section data-hero className="relative -mt-16 lg:-mt-20 overflow-hidden bg-[#2D2A26] text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} srcSet={srcSet} sizes="100vw" alt="" className="absolute inset-0 w-full h-full object-cover opacity-55" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#2D2A26]/85 via-[#2D2A26]/45 to-[#2D2A26]/10" />
            <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-24 pb-8 lg:pt-32 lg:pb-12">
                {eyebrow !== title && <p className="text-sm text-white/70 mb-1.5">{eyebrow}</p>}
                <h1 className="hero-rise text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight" style={{ fontFamily: 'var(--font-serif)' }}>
                    {title}
                </h1>
                {description && (
                    <p className="hero-rise mt-2 text-base lg:text-lg text-white/80 line-clamp-1" style={{ animationDelay: '0.15s' }}>{description}</p>
                )}
            </div>
        </section>
    )
}
