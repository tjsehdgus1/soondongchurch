'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null)
    const [menuOpen, setMenuOpen] = useState(false)
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user))
        const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
            setUser(session?.user ?? null)
        })
        return () => listener.subscription.unsubscribe()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    const navLinks = [
        { href: '/', label: '홈' },
        { href: '/events', label: '예배/행사' },
        { href: '/notices', label: '공지사항' },
    ]

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow">
                            <span className="text-white font-bold text-sm">✝</span>
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
                    </nav>

                    {/* Auth Buttons */}
                    <div className="hidden md:flex items-center gap-2">
                        {user ? (
                            <>
                                <span className="text-sm text-gray-500 mr-1 truncate max-w-xs">
                                    {user.email}
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
                        <div className="pt-2 border-t border-gray-100 flex gap-2 px-2">
                            {user ? (
                                <button
                                    onClick={() => { handleLogout(); setMenuOpen(false) }}
                                    className="w-full py-2 text-sm font-medium text-red-500 border border-red-200 rounded-lg"
                                >
                                    로그아웃
                                </button>
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
                    </div>
                )}
            </div>
        </header>
    )
}
