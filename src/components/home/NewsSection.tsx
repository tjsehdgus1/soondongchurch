import Link from 'next/link'
import SplitHeading from '@/components/motion/SplitHeading'
import Reveal from '@/components/motion/Reveal'
import { formatDate } from '@/lib/boards'

type Notice = { id: number, title: string, created_at: string, is_pinned: boolean }
type Event = { id: number, title: string, event_date: string, event_time: string | null, location: string | null }
type GalleryItem = { id: number, title: string, thumbnail_url: string, slug: string }

const EVENT_DATE = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

// 소식: 공지 · 다가오는 행사 · 사진 띠
export default function NewsSection({ notices, events, gallery }: { notices: Notice[], events: Event[], gallery: GalleryItem[] }) {
    return (
        <section className="py-24 lg:py-36 bg-[#FAF8F5] overflow-hidden">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
                <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#B8860B] mb-5">News</p>
                <SplitHeading className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#2D2A26] mb-14" style={{ fontFamily: 'var(--font-serif)' }}>
                    교회 소식
                </SplitHeading>

                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
                    <Reveal>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-[#2D2A26]">공지사항</h3>
                            <Link href="/notices" className="text-sm text-[#8B7355] hover:text-[#B8860B]">전체 →</Link>
                        </div>
                        <ul className="border-t border-[#2D2A26]">
                            {notices.length === 0 && <li className="py-6 text-sm text-[#A09890]">등록된 공지가 없습니다.</li>}
                            {notices.map((n) => (
                                <li key={n.id} className="border-b border-[#E8E4DE]">
                                    <Link href={`/notices/${n.id}`} className="group flex items-center justify-between gap-4 py-5">
                                        <span className="font-medium text-[#2D2A26] group-hover:text-[#B8860B] transition-colors line-clamp-1">
                                            {n.is_pinned && <span className="text-[#B8860B] mr-2">●</span>}{n.title}
                                        </span>
                                        <span className="text-sm text-[#A09890] shrink-0">{formatDate(n.created_at)}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Reveal>

                    <Reveal delay={0.1}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-[#2D2A26]">다가오는 행사</h3>
                            <Link href="/events" className="text-sm text-[#8B7355] hover:text-[#B8860B]">전체 →</Link>
                        </div>
                        <ul className="border-t border-[#2D2A26]">
                            {events.length === 0 && <li className="py-6 text-sm text-[#A09890]">예정된 행사가 없습니다.</li>}
                            {events.map((e) => (
                                <li key={e.id} className="border-b border-[#E8E4DE] py-5 flex gap-6">
                                    <span className="w-28 shrink-0 text-sm font-semibold text-[#B8860B]">{EVENT_DATE.format(new Date(`${e.event_date}T00:00:00`))}</span>
                                    <span>
                                        <span className="block font-medium text-[#2D2A26]">{e.title}</span>
                                        <span className="block text-sm text-[#A09890] mt-0.5">{[e.event_time?.slice(0, 5), e.location].filter(Boolean).join(' · ')}</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </Reveal>
                </div>
            </div>

            {gallery.length > 0 && (
                <div className="mt-20" aria-label="교회 사진">
                    <div className="marquee-track flex gap-4 w-max" style={{ animation: 'marquee 70s linear infinite' }}>
                        {/* 끊김 없는 반복을 위해 두 번 나열 */}
                        {[...gallery, ...gallery].map((g, i) => (
                            <Link key={`${g.id}-${i}`} href={`/board/${g.slug}/${g.id}`} tabIndex={i >= gallery.length ? -1 : undefined}
                                aria-hidden={i >= gallery.length ? true : undefined}
                                className="group relative w-64 sm:w-80 aspect-[4/3] shrink-0 overflow-hidden rounded-2xl bg-[#E8E4DE]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={g.thumbnail_url} alt={g.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <span className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity line-clamp-1">{g.title}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </section>
    )
}
