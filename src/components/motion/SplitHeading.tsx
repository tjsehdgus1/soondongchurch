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
    // true면 스크롤과 관계없이 바로 재생 (첫 화면 제목)
    immediate?: boolean
    delay?: number
}

// 제목을 줄 단위로 나눠 아래에서 위로 마스크 등장
export default function SplitHeading({ children, as: Tag = 'h2', className, style, immediate = false, delay = 0 }: SplitHeadingProps) {
    const ref = useRef<HTMLHeadingElement>(null)

    useGSAP(() => {
        const el = ref.current
        if (!el) return
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
                    scrollTrigger: immediate ? undefined : { trigger: el, start: REVEAL_START, once: true },
                })
            },
        })
        return () => split.revert()
    }, { scope: ref })

    return <Tag ref={ref} data-reveal="" className={className} style={style}>{children}</Tag>
}
