'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Fetch user profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin') {
        setIsAdmin(true)
      } else {
        // Not an admin, redirect to home
        alert('관리자 권한이 없습니다.')
        router.push('/')
      }
      setLoading(false)
    }

    checkAdmin()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-gray-500 font-medium">관리자 권한 확인 중...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) return null

  const adminNav = [
    { href: '/admin', label: '대시보드 홈', icon: '📊' },
    { href: '/admin/members', label: '교인 관리', icon: '👥' },
    { href: '/admin/events', label: '일정 관리', icon: '📅' },
    { href: '/admin/notices', label: '공지사항 관리', icon: '📢' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pt-16">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex-shrink-0 md:min-h-[calc(100vh-4rem)]">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-blue-600">⚙️</span>
            관리자 메뉴
          </h2>
          <p className="text-sm text-gray-500 mt-1 truncate">{user?.email}</p>
        </div>
        <nav className="p-4 space-y-1">
          {adminNav.map((nav) => (
            <Link
              key={nav.href}
              href={nav.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                pathname === nav.href
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">{nav.icon}</span>
              {nav.label}
            </Link>
          ))}
          <div className="pt-4 mt-4 border-t border-gray-100">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <span className="text-lg">🏠</span>
              교회 홈페이지로 돌아가기
            </Link>
          </div>
        </nav>
      </aside>

      {/* Admin Content Area */}
      <main className="flex-1 p-6 md:p-8 lg:p-10">
        {children}
      </main>
    </div>
  )
}
