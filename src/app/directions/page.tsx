'use client'

import { useEffect } from 'react'

declare global {
    interface Window {
        daum: {
            roughmap: {
                Lander: new (options: {
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
        const renderMap = () => {
            if (window.daum?.roughmap?.Lander) {
                new window.daum.roughmap.Lander({
                    timestamp: '1774420501501',
                    key: '295z2gf8banv',
                    mapWidth: '640',
                    mapHeight: '360',
                }).render()
            } else {
                setTimeout(renderMap, 200)
            }
        }

        if (document.querySelector('.daum_roughmap_loader_script')) {
            renderMap()
            return
        }

        const script = document.createElement('script')
        script.src = 'https://ssl.daumcdn.net/dmaps/map_js_init/roughmapLoader.js'
        script.charset = 'UTF-8'
        script.className = 'daum_roughmap_loader_script'
        script.onload = renderMap
        document.body.appendChild(script)
    }, [])

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Location</span>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">오시는길</h1>
                    <p className="text-gray-500 mt-2">순천순동교회를 찾아오시는 방법을 안내해 드립니다.</p>
                </div>
            </div>

            {/* 콘텐츠 */}
            <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                    {/* 지도 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div
                            id="daumRoughmapContainer1774420501501"
                            className="root_daum_roughmap root_daum_roughmap_landing w-full"
                        />
                    </div>

                    {/* 교회 정보 */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-5">교회 정보</h2>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">주소</p>
                                        <p className="text-gray-800 font-medium">전라남도 순천시 남신월 4길 3-13</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">전화</p>
                                        <p className="text-gray-800 font-medium">061-721-6707</p>
                                        <p className="text-gray-500 text-sm">FAX: 061-725-3927</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">담임목사</p>
                                        <p className="text-gray-800 font-medium">김광선 목사</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">주일 예배</p>
                                        <p className="text-gray-800 font-medium">오전 11:00 · 오후 1:30</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
