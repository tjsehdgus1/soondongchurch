'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import { MeshPhongMaterial } from 'three'
import type { MissionField } from '@/lib/content'

export const SUNCHEON = { lat: 34.95, lng: 127.49 }

type Pin = { id: number | 'home', lat: number, lng: number, label: string }

interface MissionGlobeProps {
    fields: MissionField[]
    selectedId: number | null
    onSelect: (id: number) => void
    reducedMotion: boolean
}

// 점(dot) 지구본 — 순천에서 각 선교지로 금빛 아크
export default function MissionGlobe({ fields, selectedId, onSelect, reducedMotion }: MissionGlobeProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const globeRef = useRef<GlobeMethods | undefined>(undefined)
    const [size, setSize] = useState({ width: 0, height: 0 })
    const [countries, setCountries] = useState<object[]>([])

    // 국가 경계 (점 무늬용)
    useEffect(() => {
        let cancelled = false
        fetch('/geo/countries-110m.json')
            .then((res) => res.json())
            .then((geo: { features: object[] }) => { if (!cancelled) setCountries(geo.features) })
            .catch(() => {})
        return () => { cancelled = true }
    }, [])

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const observer = new ResizeObserver(([entry]) => {
            setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
        })
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    const material = useMemo(() => new MeshPhongMaterial({ color: '#24211d', emissive: '#14120f', shininess: 6 }), [])

    const arcs = useMemo(() => fields.map((f) => ({
        startLat: SUNCHEON.lat, startLng: SUNCHEON.lng, endLat: f.lat, endLng: f.lng, id: f.id,
    })), [fields])

    const pins: Pin[] = useMemo(() => [
        { id: 'home', ...SUNCHEON, label: '순천순동교회' },
        ...fields.map((f) => ({ id: f.id, lat: f.lat, lng: f.lng, label: `${f.country}${f.region ? ` · ${f.region}` : ''}` })),
    ], [fields])

    // 초기 시점과 자동 회전 (휠 확대는 페이지 스크롤과 충돌하므로 끔)
    const handleReady = () => {
        const globe = globeRef.current
        if (!globe) return
        globe.pointOfView({ lat: 18, lng: 92, altitude: 2.3 }, 0)
        const controls = globe.controls()
        controls.enableZoom = false
        controls.autoRotate = !reducedMotion
        controls.autoRotateSpeed = 0.35
    }

    // 선교지 선택 시 그쪽으로 회전
    useEffect(() => {
        const globe = globeRef.current
        const field = fields.find((f) => f.id === selectedId)
        if (!globe || !field) return
        globe.controls().autoRotate = false
        globe.pointOfView({ lat: field.lat, lng: field.lng, altitude: 1.9 }, reducedMotion ? 0 : 1400)
    }, [selectedId, fields, reducedMotion])

    const makePin = (d: object) => {
        const pin = d as Pin
        const el = document.createElement('button')
        el.type = 'button'
        el.setAttribute('aria-label', pin.label)
        el.title = pin.label
        const home = pin.id === 'home'
        el.className = 'group relative -translate-x-1/2 -translate-y-1/2 cursor-pointer'
        el.style.pointerEvents = 'auto'
        el.innerHTML = home
            ? '<span class="block w-3 h-3 rounded-full bg-white ring-4 ring-white/30"></span>'
            : '<span class="block w-3.5 h-3.5 rounded-full bg-white ring-4 ring-white/30 transition-transform group-hover:scale-150"></span>'
        const label = document.createElement('span')
        // 가까운 선교지(태국·캄보디아) 이름이 겹치지 않게 마우스를 올렸을 때만 표시
        label.className = `absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur transition-opacity ${home ? '' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'}`
        label.textContent = pin.label
        el.appendChild(label)
        if (!home) el.addEventListener('click', () => onSelect(pin.id as number))
        return el
    }

    return (
        <div ref={containerRef} className="absolute inset-0">
            {size.width > 0 && (
                <Globe
                    ref={globeRef}
                    width={size.width}
                    height={size.height}
                    backgroundColor="rgba(0,0,0,0)"
                    globeImageUrl={null}
                    globeMaterial={material}
                    showAtmosphere
                    atmosphereColor="#d9d3c9"
                    atmosphereAltitude={0.16}
                    hexPolygonsData={countries}
                    hexPolygonResolution={3}
                    hexPolygonMargin={0.45}
                    hexPolygonUseDots
                    hexPolygonColor={() => 'rgba(250, 248, 245, 0.5)'}
                    arcsData={arcs}
                    arcColor={() => ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.9)']}
                    arcStroke={0.7}
                    arcAltitudeAutoScale={0.45}
                    arcDashLength={0.5}
                    arcDashGap={1.2}
                    arcDashAnimateTime={reducedMotion ? 0 : 2800}
                    ringsData={reducedMotion ? [] : fields}
                    ringColor={() => (t: number) => `rgba(255,255,255,${1 - t})`}
                    ringMaxRadius={3.2}
                    ringPropagationSpeed={1.6}
                    ringRepeatPeriod={1600}
                    htmlElementsData={pins}
                    htmlElement={makePin}
                    onGlobeReady={handleReady}
                />
            )}
        </div>
    )
}
