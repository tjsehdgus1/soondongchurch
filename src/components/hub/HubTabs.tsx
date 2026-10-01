'use client'

import { useRef } from 'react'
import Link from 'next/link'

export type HubTab = { slug: string, label: string, href: string }

// 허브 탭 (주소 ?tab= 로 이동). 좌우 화살표 키로 탭 사이 이동
export default function HubTabs({ tabs, active, label }: { tabs: HubTab[], active: string, label: string }) {
    const listRef = useRef<HTMLDivElement>(null)

    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
        const links = Array.from(listRef.current?.querySelectorAll<HTMLAnchorElement>('[role="tab"]') ?? [])
        const index = links.indexOf(document.activeElement as HTMLAnchorElement)
        if (index < 0) return
        e.preventDefault()
        const next = links[(index + (e.key === 'ArrowRight' ? 1 : -1) + links.length) % links.length]
        next.focus()
    }

    return (
        <div
            ref={listRef}
            role="tablist"
            aria-label={label}
            onKeyDown={onKeyDown}
            className="flex flex-wrap gap-2"
        >
            {tabs.map((tab) => {
                const selected = tab.slug === active
                return (
                    <Link
                        key={tab.slug}
                        href={tab.href}
                        scroll={false}
                        role="tab"
                        aria-selected={selected}
                        aria-controls="hub-panel"
                        tabIndex={selected ? 0 : -1}
                        className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-[15px] font-medium border transition-colors duration-300 ${selected
                            ? 'bg-[#2D2A26] border-[#2D2A26] text-white'
                            : 'bg-white border-[#E8E4DE] text-[#5C5650] hover:border-[#B8860B] hover:text-[#B8860B]'}`}
                    >
                        {tab.label}
                    </Link>
                )
            })}
        </div>
    )
}
