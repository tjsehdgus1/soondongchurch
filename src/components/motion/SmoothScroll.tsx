'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion, registerGsap } from '@/lib/motion'

let lenisInstance: Lenis | null = null

// 모바일 메뉴 등에서 스크롤 잠금용
export function getLenis(): Lenis | null {
    return lenisInstance
}

// Lenis 부드러운 스크롤 + GSAP ScrollTrigger 동기화 (동작 줄이기 설정이면 사용 안 함)
export default function SmoothScroll() {
    const pathname = usePathname()

    useEffect(() => {
        if (prefersReducedMotion()) return
        const gsap = registerGsap()
        const lenis = new Lenis({ autoRaf: false, anchors: true })
        lenisInstance = lenis
        lenis.on('scroll', ScrollTrigger.update)
        const tick = (time: number) => lenis.raf(time * 1000)
        gsap.ticker.add(tick)
        gsap.ticker.lagSmoothing(0)
        return () => {
            gsap.ticker.remove(tick)
            lenis.destroy()
            lenisInstance = null
        }
    }, [])

    // 페이지 이동 시 맨 위에서 시작
    useEffect(() => {
        lenisInstance?.scrollTo(0, { immediate: true })
        ScrollTrigger.refresh()
    }, [pathname])

    return null
}
