import Link from 'next/link'
import Image from 'next/image'
import { buildSiteMenu } from '@/lib/site-menu'

const YOUTUBE_URL = 'https://www.youtube.com/@%EC%88%9C%EC%B2%9C%EC%88%9C%EB%8F%99%EA%B5%90%ED%9A%8C'

export default function Footer() {
    const menu = buildSiteMenu({ loggedIn: false, isAdmin: false })

    return (
        <footer className="bg-[#2D2A26] text-[#A09890]">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-16 pb-10">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 pb-12 border-b border-white/10">
                    <p className="text-3xl sm:text-4xl lg:text-5xl leading-tight text-[#FAF8F5]" style={{ fontFamily: 'var(--font-serif)' }}>
                        하나님이 기뻐하시는<br />
                        <span className="text-white/60">행복한 교회</span>
                    </p>
                    <div className="flex gap-3">
                        <Link href="/worship" className="px-6 py-3 rounded-full bg-white text-[#2D2A26] text-sm hover:bg-[#FAF8F5] transition">예배 안내</Link>
                        <Link href="/directions" className="px-6 py-3 rounded-full border border-white/20 text-[#FAF8F5] text-sm hover:border-white/50 transition">오시는 길</Link>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 py-12">
                    <div className="col-span-2 md:col-span-3 lg:col-span-1 space-y-3 text-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Image src="/images/logo.svg" alt="" width={32} height={32} className="rounded-md" />
                            <span className="font-bold text-[#FAF8F5]" style={{ fontFamily: 'var(--font-serif)' }}>순천순동교회</span>
                        </div>
                        <p>전라남도 순천시 남신월 4길 3-13</p>
                        <p>Tel 061-721-6707 · Fax 061-725-3927</p>
                        <p>담임목사 김광선 · 협동목사 노상춘</p>
                        <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-2 text-[#FAF8F5] hover:text-red-400 transition">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z" /></svg>
                            유튜브 채널
                        </a>
                    </div>
                    {menu.map((section) => (
                        <div key={section.label}>
                            <p className="text-xs font-semibold tracking-[0.2em] text-white/60 mb-4">{section.label}</p>
                            <ul className="space-y-2.5 text-sm">
                                {section.items.map((item) => (
                                    <li key={item.href}>
                                        <Link href={item.href} className="hover:text-[#FAF8F5] transition-colors">{item.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="pt-8 border-t border-white/10 text-xs text-[#6B6560]">
                    <p>© {new Date().getFullYear()} 순천순동교회. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}
