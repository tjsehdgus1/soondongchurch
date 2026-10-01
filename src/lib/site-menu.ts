// 상단·푸터 메뉴 (5개 고정 — doc/specs/2026-10-01-site-redesign-design.md 1절)

export type MenuItem = { href: string, label: string }
export type MenuSection = { label: string, href: string, items: MenuItem[] }

export function buildSiteMenu({ loggedIn, isAdmin }: { loggedIn: boolean, isAdmin: boolean }): MenuSection[] {
    return [
        {
            label: '교회소개', href: '/about', items: [
                { href: '/about', label: '환영합니다' },
                { href: '/about/history', label: '걸어온 길' },
                { href: '/about/people', label: '섬기는 분들' },
                { href: '/directions', label: '오시는 길' },
            ],
        },
        {
            label: '예배·말씀', href: '/worship', items: [
                { href: '/worship', label: '예배 안내' },
                { href: '/sermons', label: '말씀' },
                { href: '/praise', label: '찬양' },
                { href: '/bulletins', label: '주보' },
            ],
        },
        {
            label: '다음세대', href: '/next-gen', items: [
                { href: '/next-gen', label: '다음세대 소개' },
                { href: '/next-gen?tab=kids', label: '유아 유치반' },
                { href: '/next-gen?tab=sunday-school', label: '주일학교' },
                { href: '/next-gen?tab=youth', label: '학생회' },
                { href: '/next-gen?tab=young-adults', label: '청년회' },
            ],
        },
        {
            label: '선교·사역', href: '/mission', items: [
                { href: '/mission', label: '선교' },
                { href: '/fellowship', label: '전도회' },
                { href: '/discipleship', label: '양육' },
            ],
        },
        {
            label: '소식·나눔', href: '/notices', items: [
                { href: '/notices', label: '공지사항' },
                { href: '/events', label: '행사일정' },
                { href: '/board/events-gallery', label: '교회 행사' },
                { href: '/board/testimony', label: '간증' },
                { href: '/board/free', label: '자유게시판' },
                ...(loggedIn ? [{ href: '/groups', label: '소그룹' }] : []),
                ...(isAdmin ? [{ href: '/admin', label: '관리자' }] : []),
            ],
        },
    ]
}

// 현재 경로가 메뉴 항목에 해당하는지 (쿼리 제외 경로 비교)
export function isMenuActive(pathname: string, href: string): boolean {
    const path = href.split('?')[0]
    return pathname === path || pathname.startsWith(`${path}/`)
}
