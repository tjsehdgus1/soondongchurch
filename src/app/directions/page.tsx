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

export default function DirectionsPage() {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.daum.roughmap = {
            phase,
            cdn: cdnKey,
            URL_KEY_DATA_LOAD_PRE: `${protocol}//t1.kakaocdn.net/roughmap/`,
            url_protocal: protocol,
            url_cdn_domain: '//t1.kakaocdn.net',
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
        <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
            {/* 헤더 */}
            <div className="bg-white border-b" style={{ borderColor: '#E8E4DE' }}>
                <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <span className="font-semibold text-sm uppercase tracking-wider" style={{ color: '#B8860B' }}>Location</span>
                    <h1 className="text-3xl md:text-4xl font-bold mt-2" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>오시는길</h1>
                    <p className="mt-2" style={{ color: '#8B7355' }}>순천순동교회를 찾아오시는 방법을 안내해 드립니다.</p>
                </div>
            </div>

            {/* 콘텐츠 */}
            <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

                {/* 지도 */}
                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden w-full" style={{ borderColor: '#E8E4DE' }}>
                    <div
                        id="daumRoughmapContainer1774420501501"
                        className="root_daum_roughmap root_daum_roughmap_landing w-full"
                    />
                </div>

                {/* 교회 정보 */}
                <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: '#E8E4DE' }}>
                    <h2 className="text-xl font-bold mb-6" style={{ color: '#2D2A26', fontFamily: 'var(--font-serif)' }}>교회 정보</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#B8860B1A' }}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#B8860B' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#8B7355' }}>주소</p>
                                <p className="font-medium text-sm" style={{ color: '#2D2A26' }}>전라남도 순천시 남신월 4길 3-13</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#B8860B1A' }}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#B8860B' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#8B7355' }}>전화</p>
                                <p className="font-medium text-sm" style={{ color: '#2D2A26' }}>061-721-6707</p>
                                <p className="text-sm" style={{ color: '#8B7355' }}>FAX: 061-725-3927</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#B8860B1A' }}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#B8860B' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#8B7355' }}>주일 예배</p>
                                <p className="font-medium text-sm" style={{ color: '#2D2A26' }}>오전 11:00 · 오후 1:30</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
