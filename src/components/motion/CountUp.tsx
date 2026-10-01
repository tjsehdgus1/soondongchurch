'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { prefersReducedMotion, registerGsap, REVEAL_START } from '@/lib/motion'

// 화면에 들어오면 0부터 숫자 증가 (서버 렌더는 최종값 → JS 없이도 정확한 숫자)
export default function CountUp({ to, suffix = '', className }: { to: number, suffix?: string, className?: string }) {
    const ref = useRef<HTMLSpanElement>(null)

    useGSAP(() => {
        const el = ref.current
        if (!el || prefersReducedMotion()) return
        const gsap = registerGsap()
        const counter = { value: 0 }
        const render = () => { el.textContent = `${Math.round(counter.value).toLocaleString('ko-KR')}${suffix}` }
        render()
        gsap.to(counter, {
            value: to,
            duration: 2,
            ease: 'power3.out',
            onUpdate: render,
            scrollTrigger: { trigger: el, start: REVEAL_START, once: true },
        })
    }, { scope: ref, dependencies: [to] })

    return <span ref={ref} className={className}>{to.toLocaleString('ko-KR')}{suffix}</span>
}
