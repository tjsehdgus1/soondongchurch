import Link from 'next/link'
import SplitHeading from '@/components/motion/SplitHeading'
import Reveal from '@/components/motion/Reveal'
import VideoCard from '@/components/video/VideoCard'
import { formatDate, postThumbnail } from '@/lib/boards'

export type EventPost = {
    id: number
    title: string
    youtube_id: string | null
    thumbnail_url: string | null
    created_at: string
}

// 교회 소식: '교회 행사' 게시판 최신 글 (영상은 바로 재생)
export default function NewsSection({ posts }: { posts: EventPost[] }) {
    if (posts.length === 0) return null

    return (
        <section className="py-16 lg:py-24 bg-[#FAF8F5]">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
                <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
                    <SplitHeading className="text-4xl sm:text-5xl font-bold text-[#2D2A26]" style={{ fontFamily: 'var(--font-serif)' }}>
                        교회 소식
                    </SplitHeading>
                    <Link href="/board/events-gallery" className="text-base font-medium text-[#5C5650] hover:text-[#2D2A26] underline-offset-4 hover:underline">
                        교회 행사 전체 보기 →
                    </Link>
                </div>

                <Reveal stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                    {posts.map((post) => {
                        const href = `/board/events-gallery/${post.id}`
                        if (post.youtube_id) {
                            return <VideoCard key={post.id} youtubeId={post.youtube_id} title={post.title} href={href} meta={formatDate(post.created_at)} />
                        }
                        const thumb = postThumbnail(post)
                        return (
                            <Link key={post.id} href={href} className="group block">
                                <div className="aspect-video rounded-2xl overflow-hidden bg-[#E8E4DE]">
                                    {thumb && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={thumb} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    )}
                                </div>
                                <p className="pt-4 text-sm text-[#8B7355]">{formatDate(post.created_at)}</p>
                                <p className="mt-1 font-bold text-[#2D2A26] group-hover:underline underline-offset-4">{post.title}</p>
                            </Link>
                        )
                    })}
                </Reveal>
            </div>
        </section>
    )
}
