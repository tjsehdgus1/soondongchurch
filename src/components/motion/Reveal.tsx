'use client'

import { useRef, type ElementType, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import { EASE_OUT, prefersReducedMotion, registerGsap, REVEAL_START } from '@/lib/motion'

interface RevealProps {
    children: ReactNode
    as?: ElementType
    className?: string
    style?: React.CSSProperties
    // up: 아래에서 떠오름, mask: 위로 걷히는 마스크 (사진용)
    variant?: 'up' | 'mask'
    // true면 직계 자식들이 순서대로 등장
    stagger?: boolean
    delay?: number
}

// 화면에 들어올 때 등장. 초기 숨김은 CSS(.js [data-reveal])가 담당 → JS가 없으면 그대로 보임
export default function Reveal({ children, as: Tag = 'div', className, style, variant = 'up', stagger = false, delay = 0 }: RevealProps) {
    const ref = useRef<HTMLElement>(null)

    useGSAP(() => {
        const el = ref.current
        if (!el) return
        const gsap = registerGsap()
        if (prefersReducedMotion()) {
            gsap.set(el, { autoAlpha: 1 })
            return
        }
        const targets = stagger ? Array.from(el.children) : el
        if (stagger) gsap.set(el, { autoAlpha: 1 })
        const from = variant === 'mask'
            ? { autoAlpha: 1, clipPath: 'inset(100% 0% 0% 0%)', scale: 1.08 }
            : { autoAlpha: 0, y: 48 }
        const to = variant === 'mask'
            ? { clipPath: 'inset(0% 0% 0% 0%)', scale: 1 }
            : { autoAlpha: 1, y: 0 }
        gsap.fromTo(targets, from, {
            ...to,
            duration: variant === 'mask' ? 1.4 : 1.1,
            ease: EASE_OUT,
            delay,
            stagger: stagger ? 0.09 : 0,
            scrollTrigger: { trigger: el, start: REVEAL_START, once: true },
        })
    }, { scope: ref })

    return <Tag ref={ref} data-reveal="" className={className} style={style}>{children}</Tag>
}
