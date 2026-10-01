'use client'

import { useRef, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import { SplitText } from 'gsap/SplitText'
import { EASE_OUT, prefersReducedMotion, registerGsap, REVEAL_START } from '@/lib/motion'

interface SplitHeadingProps {
    children: ReactNode
    as?: 'h1' | 'h2' | 'h3' | 'p'
    className?: string
    style?: React.CSSProperties
    // true면 첫 화면 제목 — CSS로 바로 등장 (줄 나눔 효과 없음)
    immediate?: boolean
    delay?: number
}

// 제목을 줄 단위로 나눠 아래에서 위로 마스크 등장
export default function SplitHeading({ children, as: Tag = 'h2', className, style, immediate = false, delay = 0 }: SplitHeadingProps) {
    const ref = useRef<HTMLHeadingElement>(null)

    useGSAP(() => {
        const el = ref.current
        if (!el || immediate) return
        const gsap = registerGsap()
        gsap.set(el, { autoAlpha: 1 })
        if (prefersReducedMotion()) return
        const split = SplitText.create(el, {
            type: 'lines',
            mask: 'lines',
            autoSplit: true,
            onSplit(self) {
                return gsap.from(self.lines, {
                    yPercent: 110,
                    duration: 1.2,
                    ease: EASE_OUT,
                    stagger: 0.12,
                    delay,
                    scrollTrigger: { trigger: el, start: REVEAL_START, once: true },
                })
            },
        })
        return () => split.revert()
    }, { scope: ref })

    // 첫 화면 제목: 숨김 없이 CSS 애니메이션으로 등장 (LCP 지연 방지)
    if (immediate) {
        return <Tag className={`hero-rise ${className ?? ''}`} style={{ ...style, animationDelay: `${0.15 + delay}s` }}>{children}</Tag>
    }
    return <Tag ref={ref} data-reveal="" className={className} style={style}>{children}</Tag>
}
