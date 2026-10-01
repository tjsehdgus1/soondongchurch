'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { buildSiteMenu, isMenuActive } from '@/lib/site-menu'
import { EASE_OUT, prefersReducedMotion, registerGsap } from '@/lib/motion'
import { getLenis } from '@/components/motion/SmoothScroll'

const YOUTUBE_URL = 'https://www.youtube.com/@%EC%88%9C%EC%B2%9C%EC%88%9C%EB%8F%99%EA%B5%90%ED%9A%8C'

interface SiteHeaderProps {
    initialLoggedIn: boolean
    initialRole: string
    initialUserName: string
}

export default function SiteHeader({ initialLoggedIn, initialRole, initialUserName }: SiteHeaderProps) {
    const pathname = usePathname()
    const [supabase] = useState(() => createClient())
    const [loggedIn, setLoggedIn] = useState(initialLoggedIn)
    const [role, setRole] = useState(initialRole)
    const [userName, setUserName] = useState(initialUserName)
    const [hidden, setHidden] = useState(false)
    // 히어로(data-hero) 위에 있을 때 투명 헤더
    const [overHero, setOverHero] = useState(false)
    // 메뉴를 연 시점의 경로를 기억 → 페이지가 바뀌면 자동으로 닫힌 상태가 됨
    const [megaOpenAt, setMegaOpenAt] = useState<string | null>(null)
    const [mobileOpenAt, setMobileOpenAt] = useState<string | null>(null)
    const megaOpen = megaOpenAt === pathname
    const mobileOpen = mobileOpenAt === pathname
    const setMegaOpen = (open: boolean) => setMegaOpenAt(open ? pathname : null)
    const setMobileOpen = (open: boolean) => setMobileOpenAt(open ? pathname : null)
    const mobileRef = useRef<HTMLDivElement>(null)

    const menu = buildSiteMenu({ loggedIn, isAdmin: role === 'admin' })

    // 로그인 상태 동기화
    useEffect(() => {
        const { data: listener } = supabase.auth.onAuthStateChange(async (_e: AuthChangeEvent, session: Session | null) => {
            const user = session?.user ?? null
            setLoggedIn(!!user)
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('role, name').eq('id', user.id).single()
                if (profile) { setRole(profile.role); setUserName(profile.name ?? '') }
            } else {
                setRole('member')
                setUserName('')
            }
        })
        return () => listener.subscription.unsubscribe()
    }, [supabase])

    // 스크롤 방향에 따라 숨김/표시, 히어로 위 투명 처리
    useEffect(() => {
        let lastY = window.scrollY
        const update = () => {
            const y = window.scrollY
            const hero = document.querySelector<HTMLElement>('[data-hero]')
            setOverHero(!!hero && y < hero.offsetHeight - 80)
            setHidden(y > 160 && y > lastY)
            lastY = y
        }
        update()
        window.addEventListener('scroll', update, { passive: true })
        return () => window.removeEventListener('scroll', update)
    }, [pathname])

    // 모바일 메뉴: 스크롤 잠금 + Esc 닫기
    useEffect(() => {
        if (!mobileOpen && !megaOpen) return
        const lenis = getLenis()
        if (mobileOpen) {
            lenis?.stop()
            document.body.style.overflow = 'hidden'
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setMobileOpenAt(null); setMegaOpenAt(null) }
        }
        window.addEventListener('keydown', onKey)
        return () => {
            lenis?.start()
            document.body.style.overflow = ''
            window.removeEventListener('keydown', onKey)
        }
    }, [mobileOpen, megaOpen])

    // 모바일 메뉴 항목 순차 등장
    useGSAP(() => {
        if (!mobileOpen || !mobileRef.current || prefersReducedMotion()) return
        const gsap = registerGsap()
        gsap.from(mobileRef.current.querySelectorAll('[data-menu-item]'), {
            y: 24, autoAlpha: 0, duration: 0.7, ease: EASE_OUT, stagger: 0.035,
        })
    }, { dependencies: [mobileOpen], scope: mobileRef })

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        window.location.href = '/auth/login'
    }

    const light = overHero && !megaOpen
    const textColor = light ? 'text-white' : 'text-[#2D2A26]'

    return (
        <>
        <header
            className={`fixed top-0 inset-x-0 z-50 transition-[transform,background-color,box-shadow] duration-500 ${hidden && !megaOpen && !mobileOpen ? '-translate-y-full' : 'translate-y-0'} ${light ? 'bg-transparent' : 'bg-[#FAF8F5]/90 backdrop-blur-md shadow-[0_1px_0_#E8E4DE]'}`}
            onMouseLeave={() => setMegaOpen(false)}
            // 키보드 포커스가 헤더 밖으로 나가면 메가 메뉴 닫기
            onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setMegaOpen(false) }}
        >
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 h-16 lg:h-20 flex items-center justify-between">
                <Link href="/" className={`flex items-center gap-3 ${textColor}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/logo.svg" alt="" className="w-9 h-9 rounded-md" />
                    <span className="font-bold text-xl tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>순천순동교회</span>
                </Link>

                {/* 데스크톱 메뉴 */}
                <nav aria-label="주 메뉴" className="hidden lg:block" onMouseEnter={() => setMegaOpen(true)} onFocus={() => setMegaOpen(true)}>
                    <ul className="flex items-center gap-1">
                        {menu.map((section) => {
                            const active = section.items.some((i) => isMenuActive(pathname, i.href))
                            return (
                                <li key={section.label}>
                                    <Link
                                        href={section.href}
                                        aria-expanded={megaOpen}
                                        aria-haspopup="true"
                                        className={`relative px-4 py-2 text-[17px] font-semibold transition-colors ${textColor} hover:text-[#8B7355]`}
                                    >
                                        {section.label}
                                        <span className={`absolute left-4 right-4 -bottom-0.5 h-px bg-current origin-left transition-transform duration-500 ${active ? 'scale-x-100' : 'scale-x-0'}`} />
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                <div className={`hidden lg:flex items-center gap-3 text-sm ${textColor}`}>
                    <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" aria-label="순천순동교회 유튜브 채널" className="opacity-70 hover:opacity-100 hover:text-red-600 transition">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z" /></svg>
                    </a>
                    {loggedIn ? (
                        <>
                            <span className="opacity-70 max-w-[140px] truncate">{userName}</span>
                            <button onClick={handleLogout} className="px-4 py-2 rounded-full border border-current/20 hover:border-red-300 hover:text-red-500 transition cursor-pointer">로그아웃</button>
                        </>
                    ) : (
                        <>
                            <Link href="/auth/login" className="px-4 py-2 rounded-full hover:text-[#8B7355] transition">로그인</Link>
                            <Link href="/auth/register" className={`px-5 py-2 rounded-full transition ${light ? 'bg-white text-[#2D2A26] hover:bg-[#FAF8F5]' : 'bg-[#2D2A26] text-white hover:bg-black'}`}>회원가입</Link>
                        </>
                    )}
                </div>

                <button
                    className={`lg:hidden p-2 -mr-2 ${mobileOpen ? 'text-[#2D2A26]' : textColor}`}
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
                    aria-expanded={mobileOpen}
                    aria-controls="mobile-menu"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        {mobileOpen
                            ? <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                            : <path strokeLinecap="round" d="M4 8h16M4 16h16" />}
                    </svg>
                </button>
            </div>

            {/* 데스크톱 메가 메뉴: 5개 메뉴 전체를 한 번에 */}
            <div
                className={`hidden lg:block absolute inset-x-0 top-full bg-[#FAF8F5] border-t border-[#E8E4DE] shadow-[0_24px_48px_-24px_rgba(45,42,38,0.25)] transition-all duration-500 ${megaOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}
                onFocus={() => setMegaOpen(true)}
            >
                <div className="max-w-[1400px] mx-auto px-10 py-10 grid grid-cols-5 gap-8">
                    {menu.map((section) => (
                        <div key={section.label}>
                            <p className="text-sm font-bold text-[#2D2A26] mb-4 pb-3 border-b border-[#E8E4DE]">{section.label}</p>
                            <ul className="space-y-2.5">
                                {section.items.map((item) => (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={`text-[17px] transition-colors hover:text-[#8B7355] ${isMenuActive(pathname, item.href) ? 'text-[#2D2A26] font-bold underline underline-offset-4' : 'text-[#5C5650]'}`}
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

        </header>

        {/* 모바일 전체 화면 메뉴 — header의 transform 밖에 둬야 fixed가 화면 기준이 됨 */}
        {mobileOpen && (
            <div id="mobile-menu" ref={mobileRef} className="lg:hidden fixed inset-x-0 bottom-0 top-16 z-40 bg-[#FAF8F5] overflow-y-auto overscroll-contain">
                <nav aria-label="모바일 메뉴" className="px-6 py-8 space-y-8">
                    {menu.map((section) => (
                        <div key={section.label}>
                            <p data-menu-item className="text-sm font-bold text-[#8B7355] mb-3">{section.label}</p>
                            <ul className="grid grid-cols-2 gap-x-4 gap-y-3">
                                {section.items.map((item) => (
                                    <li key={item.href} data-menu-item>
                                        <Link
                                            href={item.href}
                                            onClick={() => setMobileOpen(false)}
                                            className={`text-xl ${isMenuActive(pathname, item.href) ? 'text-[#2D2A26] font-bold underline underline-offset-4' : 'text-[#2D2A26]'}`}
                                            style={{ fontFamily: 'var(--font-serif)' }}
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    <div data-menu-item className="pt-6 border-t border-[#E8E4DE] flex gap-3">
                        {loggedIn ? (
                            <button onClick={handleLogout} className="flex-1 py-3 rounded-full border border-red-200 text-red-500 text-sm cursor-pointer">로그아웃</button>
                        ) : (
                            <>
                                <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="flex-1 py-3 text-center rounded-full border border-[#E8E4DE] text-sm">로그인</Link>
                                <Link href="/auth/register" onClick={() => setMobileOpen(false)} className="flex-1 py-3 text-center rounded-full bg-[#2D2A26] text-white text-sm">회원가입</Link>
                            </>
                        )}
                    </div>
                    <a data-menu-item href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 rounded-full bg-red-50 text-red-600 text-sm">
                        유튜브 채널
                    </a>
                </nav>
            </div>
        )}
        </>
    )
}
