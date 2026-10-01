'use client'

import { useEffect } from 'react'

declare global {
    interface Window {
        daum: {
            roughmap: {
                phase?: string
                cdn?: string
                URL_KEY_DATA_LOAD_PRE?: string
                url_protocal?: string
                url_cdn_domain?: string
                Lander?: new (options: {
                    timestamp: string
                    key: string
                    mapWidth: string
                    mapHeight: string
                }) => { render: () => void }
            }
        }
    }
}

// 카카오 약도 (외부 스크립트로 그림)
export default function KakaoRoughMap() {
    useEffect(() => {
        let cancelled = false

        // effect 시작 시 항상 초기화 (이전 렌더 잔재 제거)
        document.getElementById('kakao-lander-script')?.remove()
        const container = document.getElementById('daumRoughmapContainer1774420501501')
        if (container) container.innerHTML = ''

        const protocol = location.protocol === 'https:' ? 'https:' : 'http:'
        const cdnKey = '207038f2_1774248312945'
        const phase = 'prod'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.daum = (window.daum || {}) as any
        window.daum.roughmap = {
            phase,
            cdn: cdnKey,
            URL_KEY_DATA_LOAD_PRE: `${protocol}//t1.kakaocdn.net/roughmap/`,
            url_protocal: protocol,
            url_cdn_domain: '//t1.kakaocdn.net',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any

        const landerScript = document.createElement('script')
        landerScript.id = 'kakao-lander-script'
        landerScript.src = `${protocol}//t1.kakaocdn.net/kakaomapweb/roughmap/place/${phase}/${cdnKey}/roughmapLander.js`
        landerScript.charset = 'UTF-8'
        landerScript.onload = () => {
            if (cancelled) return

            // 레이아웃이 완전히 완성될 때까지 한 프레임 대기
            requestAnimationFrame(() => {
                if (cancelled) return

                const el = document.getElementById('daumRoughmapContainer1774420501501')
                if (!el) return

                // 부모 컨테이너 기준으로 width 측정 (el 자체는 0일 수 있음)
                const parent = el.parentElement
                const measured = parent?.getBoundingClientRect().width || parent?.offsetWidth || window.innerWidth - 32
                const mapWidth = String(Math.floor(Math.min(measured, 1268)))

                // 이미 렌더된 경우 중복 방지 (자동 렌더 대응)
                if (el.children.length === 0) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    new (window.daum.roughmap as any).Lander({
                        timestamp: '1774420501501',
                        key: '295z2gf8banv',
                        mapWidth,
                        mapHeight: '400',
                    }).render()
                }

                // 컨테이너 width 100% 재설정
                setTimeout(() => {
                    if (!cancelled) el.style.width = '100%'
                }, 100)

                // MutationObserver로 info 박스가 추가되는 즉시 숨김
                const observer = new MutationObserver(() => {
                    Array.from(el.children).forEach((child) => {
                        const text = child.textContent ?? ''
                        if (text.includes('주소') && text.includes('전화')) {
                            (child as HTMLElement).style.display = 'none'
                            observer.disconnect()
                        }
                    })
                })
                observer.observe(el, { childList: true, subtree: true })
            })
        }
        document.body.appendChild(landerScript)

        return () => {
            cancelled = true
            document.getElementById('kakao-lander-script')?.remove()
            const el = document.getElementById('daumRoughmapContainer1774420501501')
            if (el) el.innerHTML = ''
        }
    }, [])

    return (
        <div
            id="daumRoughmapContainer1774420501501"
            className="root_daum_roughmap root_daum_roughmap_landing w-full"
        />
    )
}
