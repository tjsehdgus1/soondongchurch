'use client'

import { useRef, useState } from 'react'
import type { GalleryImage } from '@/lib/gallery'

// 사진 갤러리: 손가락으로 옆으로 넘기거나(스크롤 스냅) 화살표·키보드로 이동
export default function ImageSlider({ images }: { images: GalleryImage[] }) {
    const trackRef = useRef<HTMLDivElement>(null)
    // 화살표로 이동 중인 목표 사진 — 빠르게 여러 번 눌러도 한 장씩 차례로 넘어가게
    const targetRef = useRef<number | null>(null)
    const [index, setIndex] = useState(0)

    const go = (dir: 1 | -1) => {
        const track = trackRef.current
        if (!track) return
        const from = targetRef.current ?? Math.round(track.scrollLeft / track.clientWidth)
        const to = Math.max(0, Math.min(images.length - 1, from + dir))
        const slide = track.children[to] as HTMLElement | undefined
        if (!slide) return
        targetRef.current = to
        track.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' })
    }

    const onScroll = () => {
        const track = trackRef.current
        if (!track) return
        const current = Math.round(track.scrollLeft / track.clientWidth)
        setIndex(current)
        if (current === targetRef.current) targetRef.current = null
    }

    const arrow = 'absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 text-[#2D2A26] text-xl shadow flex items-center justify-center transition-opacity hover:bg-white disabled:opacity-0 cursor-pointer'

    return (
        <div className="relative mb-8 rounded-xl overflow-hidden bg-[#2D2A26]" aria-roledescription="carousel" aria-label="사진 넘겨 보기">
            <div
                ref={trackRef}
                onScroll={onScroll}
                // 손으로 넘기기 시작하면 화살표 목표는 버림
                onPointerDown={() => { targetRef.current = null }}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
                    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
                }}
                className="flex overflow-x-auto snap-x snap-mandatory overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-2 focus-visible:outline-offset-2"
            >
                {images.map((img, i) => (
                    <div key={img.src + i} className="w-full shrink-0 snap-center aspect-[4/3] max-h-[75vh] flex items-center justify-center"
                        aria-roledescription="slide" aria-label={`${i + 1} / ${images.length}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.src} alt={img.alt} width={img.width} height={img.height}
                            loading={i === 0 ? 'eager' : 'lazy'} draggable={false}
                            className="max-w-full max-h-full w-auto h-auto object-contain" />
                    </div>
                ))}
            </div>

            <button type="button" onClick={() => go(-1)} disabled={index === 0} aria-label="이전 사진" className={`${arrow} left-3`}>‹</button>
            <button type="button" onClick={() => go(1)} disabled={index === images.length - 1} aria-label="다음 사진" className={`${arrow} right-3`}>›</button>
            <p className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/55 text-white text-sm tabular-nums" aria-live="polite">
                {index + 1} / {images.length}
            </p>
        </div>
    )
}
