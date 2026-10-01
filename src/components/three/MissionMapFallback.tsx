import type { MissionField } from '@/lib/content'

const SUNCHEON = { lat: 34.95, lng: 127.49 }

// 등장방형 투영 (viewBox 1000 x 500)
const project = (lat: number, lng: number) => ({ x: ((lng + 180) / 360) * 1000, y: ((90 - lat) / 180) * 500 })

interface MissionMapFallbackProps {
    fields: MissionField[]
    selectedId: number | null
    onSelect: (id: number) => void
}

// 3D를 쓸 수 없는 기기용 평면 지도 (같은 데이터, 같은 선택 동작)
export default function MissionMapFallback({ fields, selectedId, onSelect }: MissionMapFallbackProps) {
    const home = project(SUNCHEON.lat, SUNCHEON.lng)

    return (
        <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="relative w-full max-w-[1100px] aspect-[2/1]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/geo/world-map.svg" alt="" className="absolute inset-0 w-full h-full opacity-80" />
                <svg viewBox="0 0 1000 500" className="absolute inset-0 w-full h-full" aria-hidden="true">
                    {fields.map((f) => {
                        const to = project(f.lat, f.lng)
                        const midX = (home.x + to.x) / 2
                        const midY = Math.min(home.y, to.y) - 60
                        return <path key={f.id} d={`M${home.x},${home.y} Q${midX},${midY} ${to.x},${to.y}`} fill="none" stroke="#E9C46A" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.8" />
                    })}
                    <circle cx={home.x} cy={home.y} r="5" fill="#fff" />
                </svg>
                {fields.map((f) => {
                    const p = project(f.lat, f.lng)
                    const selected = f.id === selectedId
                    return (
                        <button
                            key={f.id}
                            type="button"
                            onClick={() => onSelect(f.id)}
                            aria-label={`${f.country} 선교지 보기`}
                            aria-pressed={selected}
                            className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                            style={{ left: `${p.x / 10}%`, top: `${p.y / 5}%` }}
                        >
                            <span className={`block rounded-full bg-[#E9C46A] ring-4 ring-[#E9C46A]/30 transition-transform ${selected ? 'w-4 h-4 scale-125' : 'w-3 h-3 group-hover:scale-125'}`} />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs text-white/90">{f.country}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
