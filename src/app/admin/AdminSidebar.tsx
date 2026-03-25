'use client'

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

export default function AdminSidebar({ name }: { name: string }) {
  const pathname = usePathname()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex-shrink-0 md:min-h-screen">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span className="text-blue-600">⚙️</span>
          관리자 메뉴
        </h2>
        <p className="text-sm text-gray-500 mt-1 truncate">{name}</p>
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
        <div className="pt-4 mt-4 border-t border-gray-100 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <span className="text-lg">🏠</span>
            교회 홈페이지로 돌아가기
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <span className="text-lg">🚪</span>
            로그아웃
          </button>
        </div>
      </nav>
    </aside>
  )
}
