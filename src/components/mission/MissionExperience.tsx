'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useGSAP } from '@gsap/react'
import { prefersReducedMotion, registerGsap } from '@/lib/motion'
import type { MissionField } from '@/lib/content'
import MissionMapFallback from '@/components/three/MissionMapFallback'
import SplitHeading from '@/components/motion/SplitHeading'

// three.js는 이 화면에서만 불러옴
const MissionGlobe = dynamic(() => import('@/components/three/MissionGlobe'), { ssr: false })

type Mode = 'pending' | 'globe' | 'fallback'

// WebGL 가능 + 동작 허용 + (터치 저사양 아님) 일 때만 3D
function detectMode(): Mode {
    if (prefersReducedMotion()) return 'fallback'
    try {
        const canvas = document.createElement('canvas')
        if (!(canvas.getContext('webgl2') || canvas.getContext('webgl'))) return 'fallback'
    } catch {
        return 'fallback'
    }
    const touch = window.matchMedia('(pointer: coarse)').matches
    if (touch && (navigator.hardwareConcurrency ?? 4) <= 4) return 'fallback'
    return 'globe'
}

let cachedMode: Mode | null = null
const subscribe = () => () => {}
const getMode = () => (cachedMode ??= detectMode())
const getServerMode = (): Mode => 'pending'

interface MissionExperienceProps {
    fields: MissionField[]
    title: string
    subtitle: string | null
}

export default function MissionExperience({ fields, title, subtitle }: MissionExperienceProps) {
    const mode = useSyncExternalStore(subscribe, getMode, getServerMode)
    // 3D는 첫 화면이 그려지고 브라우저가 한가할 때 시작 (초기 로딩 중 메인 스레드 점유 방지)
    const [idle, setIdle] = useState(false)
    useEffect(() => {
        if (mode !== 'globe') return
        const start = () => setIdle(true)
        // Safari는 requestIdleCallback 미지원 → 타이머로 대체
        if (typeof window.requestIdleCallback === 'function') {
            const id = window.requestIdleCallback(start, { timeout: 2500 })
            return () => window.cancelIdleCallback(id)
        }
        const id = setTimeout(start, 1200)
        return () => clearTimeout(id)
    }, [mode])
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const sectionRef = useRef<HTMLElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const selected = fields.find((f) => f.id === selectedId) ?? null

    // 스크롤로 벗어날 때 지구본이 작아지며 멀어짐
    useGSAP(() => {
        const gsap = registerGsap()
        const mm = gsap.matchMedia()
        mm.add('(prefers-reduced-motion: no-preference)', () => {
            gsap.to(stageRef.current, {
                scale: 0.75,
                autoAlpha: 0.25,
                yPercent: -8,
                ease: 'none',
                scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom top', scrub: true },
            })
        })
        return () => mm.revert()
    }, { scope: sectionRef })

    return (
        <section ref={sectionRef} data-hero className="relative -mt-16 lg:-mt-20 h-[100svh] min-h-[680px] overflow-hidden bg-[radial-gradient(ellipse_at_60%_45%,#2d2924,#14120f_70%)] text-white">
            <div ref={stageRef} className="absolute inset-0 lg:left-[22%]">
                {mode === 'globe' && idle && (
                    <MissionGlobe fields={fields} selectedId={selectedId} onSelect={setSelectedId} reducedMotion={false} />
                )}
                {mode === 'fallback' && (
                    <MissionMapFallback fields={fields} selectedId={selectedId} onSelect={setSelectedId} />
                )}
            </div>

            <div className="relative h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col justify-end pb-16 lg:pb-24 pointer-events-none">
                <p className="text-xs sm:text-sm font-semibold tracking-[0.35em] uppercase text-white/60 mb-5">Mission</p>
                <SplitHeading as="h1" immediate className="text-5xl sm:text-6xl lg:text-8xl font-bold leading-[1.08]" style={{ fontFamily: 'var(--font-serif)' }}>
                    {title}
                </SplitHeading>
                {subtitle && <p className="mt-5 text-white/70 max-w-md">{subtitle}</p>}
                <p className="mt-8 text-sm text-white/50">{mode === 'globe' ? '지구본을 돌리거나 빛나는 선교지를 눌러 보세요' : '선교지를 눌러 보세요'}</p>
            </div>

            {/* 선택한 선교지 */}
            {selected && (
                <div role="dialog" aria-label={`${selected.country} 선교지`} className="absolute right-4 left-4 sm:left-auto sm:right-8 bottom-6 sm:bottom-auto sm:top-28 sm:w-[360px] rounded-3xl bg-[#FAF8F5] text-[#2D2A26] shadow-2xl overflow-hidden animate-[fade-in_0.4s_ease-out]">
                    {selected.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={selected.image_url} alt="" className="w-full aspect-video object-cover" />
                    )}
                    <div className="p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs tracking-[0.25em] text-[#B8860B]">{selected.region}</p>
                                <p className="text-2xl font-bold mt-1" style={{ fontFamily: 'var(--font-serif)' }}>{selected.country}</p>
                            </div>
                            <button onClick={() => setSelectedId(null)} aria-label="닫기" className="w-9 h-9 rounded-full hover:bg-[#F2EFE9] flex items-center justify-center cursor-pointer">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        {selected.missionaries && <p className="mt-3 text-sm font-semibold">{selected.missionaries}</p>}
                        {selected.summary && <p className="mt-2 text-sm text-[#5C5650] leading-relaxed">{selected.summary}</p>}
                        {selected.board_slug && (
                            <Link href={`/mission?tab=${selected.board_slug}#stories`} className="inline-block mt-5 text-sm font-semibold text-[#B8860B] hover:underline underline-offset-4">
                                관련 소식 보기 →
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </section>
    )
}
