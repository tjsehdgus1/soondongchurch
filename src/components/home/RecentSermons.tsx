import Link from 'next/link'
import SplitHeading from '@/components/motion/SplitHeading'
import Reveal from '@/components/motion/Reveal'
import VideoCard from '@/components/video/VideoCard'
import { formatDate } from '@/lib/boards'

export type SermonVideo = {
    id: number
    title: string
    youtube_id: string
    created_at: string
    boards: { slug: string, name: string }
}

// 최근 말씀 2편 (왼쪽 담임목사·오른쪽 협동목사) — 같은 크기 카드, 썸네일·제목 잘림 없이. 누르면 모달 재생
export default function RecentSermons({ videos }: { videos: SermonVideo[] }) {
    if (videos.length === 0) return null

    return (
        <section className="py-16 lg:py-24 bg-white">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
                <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
                    <SplitHeading className="text-4xl sm:text-5xl font-bold text-[#2D2A26]" style={{ fontFamily: 'var(--font-serif)' }}>
                        최근 말씀
                    </SplitHeading>
                    <Link href="/sermons" className="text-base font-medium text-[#5C5650] hover:text-[#2D2A26] underline-offset-4 hover:underline">
                        말씀 전체 보기 →
                    </Link>
                </div>

                <Reveal stagger className="grid md:grid-cols-2 gap-x-8 gap-y-10">
                    {videos.slice(0, 2).map((v) => (
                        <VideoCard key={v.id} size="lg" youtubeId={v.youtube_id} title={v.title}
                            href={`/board/${v.boards.slug}/${v.id}`} meta={`${v.boards.name} · ${formatDate(v.created_at)}`} />
                    ))}
                </Reveal>
            </div>
        </section>
    )
}
