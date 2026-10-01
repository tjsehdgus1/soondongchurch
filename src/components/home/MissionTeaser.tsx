import Link from 'next/link'
import SplitHeading from '@/components/motion/SplitHeading'
import Reveal from '@/components/motion/Reveal'
import type { MissionField } from '@/lib/content'

const SUNCHEON = { lat: 34.95, lng: 127.49 }
// 등장방형 투영 (viewBox 1000 x 500)
const project = (lat: number, lng: number) => ({ x: ((lng + 180) / 360) * 1000, y: ((90 - lat) / 180) * 500 })
// 아시아·아프리카가 보이도록 지도 일부만 표시 (경도 0~160, 위도 60N~25S)
const VIEW = { x: 500, y: 83, w: 444, h: 236 }

// 홈 선교 소개: 평면 지도 위 순천 → 선교지 (3D 지구본은 /mission 에서만)
export default function MissionTeaser({ fields }: { fields: MissionField[] }) {
    if (fields.length === 0) return null
    const home = project(SUNCHEON.lat, SUNCHEON.lng)

    return (
        <section className="py-16 lg:py-24 bg-[#F2EFE9]">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
                <div className="lg:col-span-5">
                    <SplitHeading className="text-4xl sm:text-5xl font-bold leading-[1.2] text-[#2D2A26]" style={{ fontFamily: 'var(--font-serif)' }}>
                        순천에서<br />땅 끝까지
                    </SplitHeading>
                    <Reveal className="mt-5 text-[#5C5650] leading-relaxed">
                        <p>오직 성령이 너희에게 임하시면 너희가 권능을 받고 땅 끝까지 이르러 내 증인이 되리라 (행 1:8)</p>
                    </Reveal>
                    <Reveal stagger className="mt-8 divide-y divide-[#DCD5CA] border-y border-[#DCD5CA]">
                        {fields.map((f) => (
                            <div key={f.id} className="flex items-baseline justify-between gap-4 py-3.5">
                                <p className="text-lg font-bold text-[#2D2A26]">{f.country}<span className="ml-2 text-base font-normal text-[#8B7355]">{f.region}</span></p>
                                {f.missionaries && <p className="text-base text-[#5C5650] text-right">{f.missionaries}</p>}
                            </div>
                        ))}
                    </Reveal>
                    <Reveal className="mt-8">
                        <Link href="/mission" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#2D2A26] text-white text-base font-semibold hover:bg-black transition-colors">
                            선교 이야기 보기 →
                        </Link>
                    </Reveal>
                </div>

                <Reveal className="lg:col-span-7">
                    <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} className="w-full h-auto" role="img" aria-label={`순천에서 ${fields.map((f) => f.country).join(', ')}로 이어진 선교지 지도`}>
                        <image href="/geo/world-map-light.svg" x="0" y="0" width="1000" height="500" />
                        {fields.map((f) => {
                            const to = project(f.lat, f.lng)
                            const midX = (home.x + to.x) / 2
                            const midY = Math.min(home.y, to.y) - 35
                            return <path key={f.id} d={`M${home.x},${home.y} Q${midX},${midY} ${to.x},${to.y}`} fill="none" stroke="#2D2A26" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
                        })}
                        {fields.map((f) => {
                            const p = project(f.lat, f.lng)
                            // 바로 오른쪽에 다른 선교지가 있으면(태국·캄보디아) 이름을 왼쪽에 둠
                            const crowded = fields.some((o) => {
                                const q = project(o.lat, o.lng)
                                return o.id !== f.id && q.x > p.x && q.x - p.x < 30 && Math.abs(q.y - p.y) < 15
                            })
                            return (
                                <g key={f.id}>
                                    <circle cx={p.x} cy={p.y} r="3.2" fill="#2D2A26" />
                                    <text x={crowded ? p.x - 5 : p.x + 5} y={p.y + 3.5} textAnchor={crowded ? 'end' : 'start'} fontSize="9" fill="#2D2A26" fontWeight="600">{f.country}</text>
                                </g>
                            )
                        })}
                        <circle cx={home.x} cy={home.y} r="4" fill="#B8860B" stroke="#fff" strokeWidth="1.5" />
                        <text x={home.x + 6} y={home.y - 5} fontSize="9" fill="#2D2A26" fontWeight="700">순천</text>
                    </svg>
                </Reveal>
            </div>
        </section>
    )
}
