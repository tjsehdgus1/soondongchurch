'use client'

import { useRef, type ReactNode } from 'react'
import Link from 'next/link'
import { useGSAP } from '@gsap/react'
import { hasFinePointer, prefersReducedMotion, registerGsap } from '@/lib/motion'

interface MagneticButtonProps {
    href: string
    children: ReactNode
    className?: string
    style?: React.CSSProperties
    // 포인터를 따라가는 정도 (0~1)
    strength?: number
}

// 마우스를 살짝 따라오는 링크 버튼 (터치 기기·동작 줄이기에서는 일반 버튼)
export default function MagneticButton({ href, children, className, style, strength = 0.3 }: MagneticButtonProps) {
    const ref = useRef<HTMLAnchorElement>(null)

    useGSAP((_, contextSafe) => {
        const el = ref.current
        if (!el || !contextSafe || !hasFinePointer() || prefersReducedMotion()) return
        const gsap = registerGsap()
        const move = contextSafe((e: MouseEvent) => {
            const rect = el.getBoundingClientRect()
            gsap.to(el, {
                x: (e.clientX - rect.left - rect.width / 2) * strength,
                y: (e.clientY - rect.top - rect.height / 2) * strength,
                duration: 0.4,
                ease: 'power3.out',
            })
        })
        const leave = contextSafe(() => gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' }))
        el.addEventListener('mousemove', move)
        el.addEventListener('mouseleave', leave)
        return () => {
            el.removeEventListener('mousemove', move)
            el.removeEventListener('mouseleave', leave)
        }
    }, { scope: ref })

    return <Link ref={ref} href={href} className={className} style={style}>{children}</Link>
}
