import SplitHeading from '@/components/motion/SplitHeading'
import Reveal from '@/components/motion/Reveal'
import MagneticButton from '@/components/motion/MagneticButton'
import type { MissionField } from '@/lib/content'

// 선교 맛보기: 가벼운 CSS 지구 + 선교지 목록 (3D 지구본은 /mission 에서만)
export default function MissionTeaser({ fields }: { fields: MissionField[] }) {
    if (fields.length === 0) return null

    return (
        <section className="relative overflow-hidden bg-[#F2EFE9] py-24 lg:py-36">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 grid lg:grid-cols-2 gap-16 items-center">
                <div>
                    <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#B8860B] mb-5">Mission</p>
                    <SplitHeading className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.15] text-[#2D2A26]" style={{ fontFamily: 'var(--font-serif)' }}>
                        순천에서<br />땅 끝까지
                    </SplitHeading>
                    <Reveal className="mt-6 text-[#5C5650] leading-relaxed max-w-md">
                        <p>오직 성령이 너희에게 임하시면 너희가 권능을 받고 땅 끝까지 이르러 내 증인이 되리라 (행 1:8)</p>
                    </Reveal>
                    <Reveal stagger className="mt-10 divide-y divide-[#E8E4DE] border-y border-[#E8E4DE]">
                        {fields.map((f) => (
                            <div key={f.id} className="flex items-baseline justify-between gap-4 py-4">
                                <p className="text-lg font-bold text-[#2D2A26]" style={{ fontFamily: 'var(--font-serif)' }}>{f.country}<span className="ml-2 text-sm font-normal text-[#8B7355]">{f.region}</span></p>
                                {f.missionaries && <p className="text-sm text-[#8B7355] text-right">{f.missionaries}</p>}
                            </div>
                        ))}
                    </Reveal>
                    <Reveal className="mt-10">
                        <MagneticButton href="/mission" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#2D2A26] text-white text-sm font-semibold hover:bg-black transition-colors">
                            선교 이야기 보기 →
                        </MagneticButton>
                    </Reveal>
                </div>

                <Reveal variant="mask" className="relative aspect-square max-w-[560px] w-full mx-auto">
                    <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,#3a352f,#2D2A26_70%)] shadow-[0_40px_80px_-30px_rgba(45,42,38,0.6)]" />
                    <div
                        aria-hidden="true"
                        className="globe-drift absolute inset-0 rounded-full opacity-70"
                        style={{
                            backgroundImage: 'radial-gradient(circle, rgba(250,248,245,0.55) 1.2px, transparent 1.8px)',
                            backgroundSize: '14px 14px',
                            maskImage: 'radial-gradient(circle at 40% 40%, black 30%, transparent 70%)',
                            WebkitMaskImage: 'radial-gradient(circle at 40% 40%, black 30%, transparent 70%)',
                            animation: 'globe-drift 40s linear infinite',
                        }}
                    />
                    <div className="absolute inset-0 rounded-full ring-1 ring-white/30" />
                    <p className="absolute bottom-[12%] left-1/2 -translate-x-1/2 text-center text-white">
                        <span className="block text-6xl font-bold text-white" style={{ fontFamily: 'var(--font-serif)' }}>{fields.length}</span>
                        <span className="text-xs tracking-[0.3em] text-white/60">MISSION FIELDS</span>
                    </p>
                </Reveal>
            </div>
        </section>
    )
}
