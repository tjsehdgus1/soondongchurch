'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface NavbarProps {
    initialUser: User | null
    initialRole: string
    initialUserName: string
}

export default function Navbar({ initialUser, initialRole, initialUserName }: NavbarProps) {
    const [user, setUser] = useState<User | null>(initialUser)
    const [role, setRole] = useState(initialRole)
    const [userName, setUserName] = useState(initialUserName)
    const [menuOpen, setMenuOpen] = useState(false)
    const pathname = usePathname()
    const supabase = useRef(createClient()).current

    useEffect(() => {
        const { data: listener } = supabase.auth.onAuthStateChange(async (_e, session) => {
            const sessionUser = session?.user ?? null
            setUser(sessionUser)
            if (sessionUser) {
                const { data: profile } = await supabase.from('profiles').select('role, name').eq('id', sessionUser.id).single()
                if (profile) { setRole(profile.role); setUserName(profile.name ?? '') }
            } else {
                setRole('member')
                setUserName('')
            }
        })
        return () => listener.subscription.unsubscribe()
    }, [])

    const handleLogout = async () => {
        const timeout = new Promise<void>(resolve => setTimeout(resolve, 2000))
        await Promise.race([supabase.auth.signOut(), timeout])
        window.location.href = '/auth/login'
    }

    const navLinks = [
        { href: '/', label: '홈' },
        { href: '/events', label: '예배/행사' },
        { href: '/sermons', label: '설교' },
        { href: '/notices', label: '공지사항' },
        { href: '/bulletins', label: '주간예배일정(주보)' },
    ]

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm">
            <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative w-10 h-10 overflow-hidden rounded-md shadow-sm transition-transform group-hover:scale-105">
                            <img
                                src="/images/logo.svg"
                                alt="순천순동교회 로고"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span className="font-bold text-gray-800 text-lg group-hover:text-blue-700 transition-colors">
                            순천순동교회
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map(({ href, label }) => (
                            <Link
                                key={href}
                                href={href}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === href
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                {label}
                            </Link>
                        ))}
                        {/* 로그인 시 소그룹 메뉴 표출 */}
                        {user && (
                            <Link
                                href="/groups"
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname.startsWith('/groups')
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                소그룹
                            </Link>
                        )}
                        {/* 관리자 로그인 시 공지사항 옆에 관리자 홈 버튼 표출 */}
                        {user && role === 'admin' && (
                            <Link
                                href="/admin"
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${pathname.startsWith('/admin')
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800'
                                    }`}
                            >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                </svg>
                                관리자
                            </Link>
                        )}
                    </nav>

                    {/* Desktop Right Side (Socials + Auth) */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* YouTube Link */}
                        <Link href="https://www.youtube.com/@%EC%88%9C%EC%B2%9C%EC%88%9C%EB%8F%99%EA%B5%90%ED%9A%8C"
                            target="_blank" rel="noopener noreferrer"
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            aria-label="순천순동교회 유튜브 채널">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.086 0 12 0 12s0 3.914.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.872.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.914 24 12 24 12s0-3.914-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                        </Link>

                        {/* Auth Buttons */}
                        <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                            {user ? (
                                <>
                                    <span className="text-sm text-gray-500 mr-1 truncate max-w-[180px]">
                                        {userName}
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-500 border border-gray-200 rounded-lg hover:border-red-200 transition-colors"
                                    >
                                        로그아웃
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/auth/login"
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 border border-gray-200 rounded-lg hover:border-blue-200 transition-colors"
                                    >
                                        로그인
                                    </Link>
                                    <Link
                                        href="/auth/register"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                                    >
                                        회원가입
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="메뉴 열기"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {menuOpen
                                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            }
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                {menuOpen && (
                    <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
                        {navLinks.map(({ href, label }) => (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setMenuOpen(false)}
                                className={`block px-4 py-2 rounded-lg text-sm font-medium ${pathname === href ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {label}
                            </Link>
                        ))}
                        {user && (
                            <Link
                                href="/groups"
                                onClick={() => setMenuOpen(false)}
                                className={`block px-4 py-2 rounded-lg text-sm font-medium ${pathname.startsWith('/groups') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                소그룹
                            </Link>
                        )}
                        {user && role === 'admin' && (
                            <Link href="/admin" onClick={() => setMenuOpen(false)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${pathname.startsWith('/admin') ? 'bg-indigo-100 text-indigo-700' : 'text-indigo-600 hover:bg-indigo-50'}`}>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                </svg>
                                관리자
                            </Link>
                        )}
                        <div className="pt-2 border-t border-gray-100 flex gap-2 px-2">
                            {user ? (
                                <div className="w-full flex flex-col gap-2">
                                    <button
                                        onClick={() => { handleLogout(); setMenuOpen(false) }}
                                        className="w-full py-2 text-sm font-medium text-red-500 border border-red-200 rounded-lg"
                                    >
                                        로그아웃
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Link href="/auth/login" onClick={() => setMenuOpen(false)}
                                        className="flex-1 py-2 text-center text-sm font-medium text-gray-600 border border-gray-200 rounded-lg">
                                        로그인
                                    </Link>
                                    <Link href="/auth/register" onClick={() => setMenuOpen(false)}
                                        className="flex-1 py-2 text-center text-sm font-medium text-white bg-blue-600 rounded-lg">
                                        회원가입
                                    </Link>
                                </>
                            )}
                        </div>
                        <div className="pt-2 px-4 pb-2">
                            <Link href="https://www.youtube.com/@%EC%88%9C%EC%B2%9C%EC%88%9C%EB%8F%99%EA%B5%90%ED%9A%8C"
                                target="_blank" rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.086 0 12 0 12s0 3.914.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.872.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.914 24 12 24 12s0-3.914-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                </svg>
                                유튜브 채널
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}
