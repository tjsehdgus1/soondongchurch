'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const adminNav = [
  { href: '/admin', label: '대시보드 홈', icon: '📊' },
  { href: '/admin/sermons', label: '설교 영상 관리', icon: '📽️' },
  { href: '/admin/bulletins', label: '주간예배일정 관리', icon: '📄' },
  { href: '/admin/events', label: '행사일정 관리', icon: '📅' },
  { href: '/admin/notices', label: '공지사항 관리', icon: '📢' },
  { href: '/admin/groups', label: '소그룹 관리', icon: '🏘️' },
  { href: '/admin/members', label: '교인 관리', icon: '👥' },
]

function isActive(navHref: string, pathname: string) {
  if (navHref === '/admin') return pathname === '/admin'
  return pathname === navHref || pathname.startsWith(navHref + '/')
}

export default function AdminSidebar({ name }: { name: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const currentNav = adminNav.find((n) => isActive(n.href, pathname)) ?? adminNav[0]

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  const navLinks = (
    <>
      {adminNav.map((nav) => (
        <Link
          key={nav.href}
          href={nav.href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            isActive(nav.href, pathname)
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <span className="text-lg">{nav.icon}</span>
          {nav.label}
        </Link>
      ))}
      <div className="pt-4 mt-4 border-t border-gray-100 space-y-1">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <span className="text-lg">🏠</span>
          홈페이지로 돌아가기
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <span className="text-lg">🚪</span>
          로그아웃
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* ── 모바일: 현재 메뉴 + 토글 버튼 ── */}
      <div className="md:hidden sticky top-16 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{currentNav.icon}</span>
            <div>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">관리자</p>
              <p className="text-sm font-bold text-gray-900 leading-tight">{currentNav.label}</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="메뉴 열기"
          >
            메뉴
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* 드롭다운 메뉴 */}
        {open && (
          <>
            {/* 배경 오버레이 */}
            <div
              className="fixed inset-0 z-30 bg-black/20"
              onClick={() => setOpen(false)}
            />
            {/* 메뉴 패널 */}
            <div className="absolute left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-lg p-3">
              {navLinks}
            </div>
          </>
        )}
      </div>

      {/* ── 데스크탑: 고정 사이드바 ── */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200 flex-shrink-0 min-h-screen">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-blue-600">⚙️</span>
            관리자 메뉴
          </h2>
          <p className="text-sm text-gray-500 mt-1 truncate">{name}</p>
        </div>
        <nav className="p-4 space-y-1 flex-1">
          {navLinks}
        </nav>
      </aside>
    </>
  )
}
