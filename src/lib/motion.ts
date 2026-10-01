// GSAP 플러그인 등록과 모션 공통 설정 (클라이언트 전용)
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

let registered = false

export function registerGsap() {
    if (!registered && typeof window !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)
        registered = true
    }
    return gsap
}

export function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// 마우스처럼 정밀한 포인터 (터치 기기 제외)
export function hasFinePointer(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
}

export const EASE_OUT = 'expo.out'

// 화면 하단 15% 지점에 들어오면 한 번 재생
export const REVEAL_START = 'top 85%'
