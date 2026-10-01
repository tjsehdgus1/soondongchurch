import SplitHeading from '@/components/motion/SplitHeading'
import Reveal from '@/components/motion/Reveal'
import MagneticButton from '@/components/motion/MagneticButton'
import VideoCard from '@/components/video/VideoCard'
import { formatDate } from '@/lib/boards'

export type SermonVideo = {
    id: number
    title: string
    youtube_id: string
    created_at: string
    boards: { slug: string, name: string }
}

// 최근 말씀: 큰 카드 1 + 작은 카드 2, 누르면 모달 재생
export default function RecentSermons({ videos }: { videos: SermonVideo[] }) {
    if (videos.length === 0) return null
    const [main, ...rest] = videos

    return (
        <section className="py-24 lg:py-36 bg-white">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
                <div className="flex flex-wrap items-end justify-between gap-6 mb-14">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#B8860B] mb-5">Sermons</p>
                        <SplitHeading className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#2D2A26]" style={{ fontFamily: 'var(--font-serif)' }}>
                            최근 말씀
                        </SplitHeading>
                    </div>
                    <MagneticButton href="/sermons" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#E8E4DE] text-sm font-medium text-[#5C5650] hover:border-[#B8860B] hover:text-[#B8860B] transition-colors">
                        전체 말씀 보기 →
                    </MagneticButton>
                </div>

                <div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
                    <Reveal className="lg:col-span-3 flex">
                        <VideoCard size="lg" youtubeId={main.youtube_id} title={main.title}
                            href={`/board/${main.boards.slug}/${main.id}`} meta={`${main.boards.name} · ${formatDate(main.created_at)}`} />
                    </Reveal>
                    <Reveal stagger className="lg:col-span-2 grid gap-8">
                        {rest.map((v) => (
                            <VideoCard key={v.id} youtubeId={v.youtube_id} title={v.title}
                                href={`/board/${v.boards.slug}/${v.id}`} meta={`${v.boards.name} · ${formatDate(v.created_at)}`} />
                        ))}
                    </Reveal>
                </div>
            </div>
        </section>
    )
}
