'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useIsAdmin } from '@/components/admin/AdminContext'
import { adminLinksFor } from '@/lib/admin-links'

// 관리자로 로그인했을 때 화면 오른쪽 아래: 지금 보는 화면을 고치는 관리 화면 바로가기
export default function AdminPageBar() {
    const isAdmin = useIsAdmin()
    const pathname = usePathname()
    const links = adminLinksFor(pathname)
    if (!isAdmin || links.length === 0) return null

    return (
        <nav aria-label="관리자 바로가기" className="fixed z-40 right-4 bottom-4 flex flex-col items-end gap-2">
            {links.map((link) => (
                <Link key={link.href} href={link.href}
                    className="px-4 py-2.5 rounded-full bg-[#2D2A26] text-white text-sm font-semibold shadow-[0_8px_24px_-8px_rgba(45,42,38,0.5)] hover:bg-black transition-colors">
                    {link.label}
                </Link>
            ))}
        </nav>
    )
}
