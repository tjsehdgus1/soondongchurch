'use client'

import { useVideoModal } from '@/components/video/VideoModal'

interface VideoCardProps {
    youtubeId: string
    title: string
    // 글 상세 주소 (모달의 '글 보기')
    href: string
    meta?: string
    size?: 'lg' | 'md'
}

// 썸네일 카드 — 누르면 모달에서 바로 재생
export default function VideoCard({ youtubeId, title, href, meta, size = 'md' }: VideoCardProps) {
    const openVideo = useVideoModal()
    const large = size === 'lg'

    return (
        <button
            type="button"
            onClick={() => openVideo({ youtubeId, title, href })}
            className="group text-left w-full h-full flex flex-col cursor-pointer"
            aria-label={`${title} 영상 재생`}
        >
            <div className={`relative overflow-hidden rounded-2xl bg-[#1F1D1A] ${large ? 'aspect-video lg:aspect-auto lg:flex-1 lg:min-h-[420px]' : 'aspect-video'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={`https://img.youtube.com/vi/${youtubeId}/${large ? 'maxresdefault' : 'hqdefault'}.jpg`}
                    onError={(e) => { e.currentTarget.src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` }}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`rounded-full bg-white/90 text-[#B8860B] flex items-center justify-center shadow-xl transition-transform duration-500 group-hover:scale-110 ${large ? 'w-20 h-20' : 'w-14 h-14'}`}>
                        <svg className={`${large ? 'w-7 h-7' : 'w-5 h-5'} translate-x-0.5`} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                    </span>
                </div>
            </div>
            <div className="pt-4">
                {meta && <p className="text-xs font-semibold tracking-wider text-[#B8860B] mb-1.5">{meta}</p>}
                <p className={`font-bold leading-snug text-[#2D2A26] group-hover:text-[#B8860B] transition-colors line-clamp-2 ${large ? 'text-xl lg:text-2xl' : 'text-base'}`} style={large ? { fontFamily: 'var(--font-serif)' } : undefined}>
                    {title}
                </p>
            </div>
        </button>
    )
}
