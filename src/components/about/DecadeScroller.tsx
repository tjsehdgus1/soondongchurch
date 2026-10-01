'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { registerGsap } from '@/lib/motion'

export type DecadeChapter = {
    decade: number
    count: number
    highlights: { year: number, title: string }[]
}

// 연대별 장(章)을 가로로 넘기는 고정 섹션
// 데스크톱 + 동작 허용: 세로 스크롤 → 가로 이동 / 그 외: 손가락으로 넘기는 가로 스크롤
export default function DecadeScroller({ chapters }: { chapters: DecadeChapter[] }) {
    const sectionRef = useRef<HTMLElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const progressRef = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        const section = sectionRef.current
        const track = trackRef.current
        if (!section || !track) return
        const gsap = registerGsap()
        const mm = gsap.matchMedia()
        mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
            const distance = () => track.scrollWidth - window.innerWidth
            gsap.to(track, {
                x: () => -distance(),
                ease: 'none',
                scrollTrigger: {
                    trigger: section,
                    start: 'top top',
                    end: () => `+=${distance()}`,
                    pin: true,
                    scrub: 1,
                    invalidateOnRefresh: true,
                    onUpdate: (self) => {
                        if (progressRef.current) progressRef.current.style.transform = `scaleX(${self.progress})`
                    },
                },
            })
        })
        return () => mm.revert()
    }, { scope: sectionRef })

    return (
        <section ref={sectionRef} className="relative bg-[#2D2A26] text-white overflow-hidden lg:h-screen">
            <div ref={trackRef} className="flex h-full overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none">
                <div className="shrink-0 w-[85vw] lg:w-[45vw] flex flex-col justify-center px-6 lg:px-16 py-20 snap-start">
                    <p className="text-xs tracking-[0.35em] uppercase text-white/60 mb-6">Chapters</p>
                    <p className="text-4xl lg:text-6xl font-bold leading-tight" style={{ fontFamily: 'var(--font-serif)' }}>
                        {chapters[0]?.decade}년대부터<br />오늘까지
                    </p>
                    <p className="mt-6 text-white/60 hidden lg:block">스크롤하면 연대별 이야기가 이어집니다 →</p>
                    <p className="mt-6 text-white/60 lg:hidden">옆으로 넘겨 보세요 →</p>
                </div>
                {chapters.map((c) => (
                    <article key={c.decade} className="shrink-0 w-[85vw] sm:w-[60vw] lg:w-[34vw] border-l border-white/10 px-6 lg:px-12 py-20 flex flex-col justify-center snap-start">
                        <p className="text-7xl lg:text-[9rem] leading-none font-bold text-white/90 tabular-nums" style={{ fontFamily: 'var(--font-serif)' }}>
                            {c.decade}<span className="text-4xl lg:text-6xl">s</span>
                        </p>
                        <p className="mt-4 text-xs tracking-[0.3em] text-white/50">{c.count}개의 기록</p>
                        <ul className="mt-8 space-y-4">
                            {c.highlights.map((h, i) => (
                                <li key={i} className="flex gap-4 text-sm lg:text-base leading-relaxed text-white/80">
                                    <span className="shrink-0 font-semibold text-white/60 tabular-nums">{h.year}</span>
                                    <span className="line-clamp-3">{h.title}</span>
                                </li>
                            ))}
                        </ul>
                    </article>
                ))}
                <div className="shrink-0 w-[10vw] hidden lg:block" />
            </div>
            <div className="hidden lg:block absolute bottom-10 left-16 right-16 h-px bg-white/15">
                <div ref={progressRef} className="h-full bg-white origin-left" style={{ transform: 'scaleX(0)' }} />
            </div>
        </section>
    )
}
