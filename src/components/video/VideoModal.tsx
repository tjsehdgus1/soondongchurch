'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { getLenis } from '@/components/motion/SmoothScroll'

type VideoRequest = { youtubeId: string, title: string, href?: string }

const VideoModalContext = createContext<(video: VideoRequest) => void>(() => {})

export function useVideoModal() {
    return useContext(VideoModalContext)
}

// 페이지 이동 없이 유튜브 영상을 바로 재생하는 모달 (<dialog>: 포커스 가두기·Esc 닫기 기본 제공)
export default function VideoModalProvider({ children }: { children: ReactNode }) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [video, setVideo] = useState<VideoRequest | null>(null)

    const open = useCallback((next: VideoRequest) => {
        setVideo(next)
        dialogRef.current?.showModal()
        getLenis()?.stop()
    }, [])

    const close = useCallback(() => dialogRef.current?.close(), [])

    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return
        // 닫히면 iframe을 제거해 재생 중지
        const onClose = () => {
            setVideo(null)
            getLenis()?.start()
        }
        dialog.addEventListener('close', onClose)
        return () => dialog.removeEventListener('close', onClose)
    }, [])

    return (
        <VideoModalContext.Provider value={open}>
            {children}
            <dialog
                ref={dialogRef}
                aria-label={video?.title ?? '영상'}
                className="m-auto w-[min(1100px,94vw)] bg-transparent p-0 backdrop:bg-black/85 backdrop:backdrop-blur-sm open:animate-[fade-in_0.3s_ease-out]"
                // 바깥(배경) 클릭 시 닫기
                onClick={(e) => { if (e.target === e.currentTarget) close() }}
            >
                {video && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4 text-white">
                            <p className="text-sm sm:text-base font-medium line-clamp-1">{video.title}</p>
                            <div className="flex items-center gap-2 shrink-0">
                                {video.href && (
                                    <Link href={video.href} onClick={close} className="px-4 py-2 rounded-full border border-white/30 text-sm hover:bg-white/10">
                                        글 보기
                                    </Link>
                                )}
                                <button onClick={close} aria-label="닫기" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                        <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
                            <iframe
                                src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
                                title={video.title}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            />
                        </div>
                    </div>
                )}
            </dialog>
        </VideoModalContext.Provider>
    )
}
