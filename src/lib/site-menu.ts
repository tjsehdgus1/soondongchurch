// 상단 메뉴 (5개 고정 — doc/specs/2026-10-01-site-redesign-design.md 1절)

export type MenuItem = { href: string, label: string }
export type MenuSection = { label: string, href: string, items: MenuItem[] }

export function buildSiteMenu({ isAdmin }: { isAdmin: boolean }): MenuSection[] {
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
            ],
        },
        // 관리자로 로그인하면 메뉴 오른쪽 끝에 관리 화면 묶음
        ...(isAdmin ? [{ label: '관리자', href: '/admin', items: ADMIN_ITEMS }] : []),
    ]
}

// 관리 화면 (src/app/admin/AdminSidebar.tsx 와 같은 순서)
const ADMIN_ITEMS: MenuItem[] = [
    { href: '/admin', label: '대시보드' },
    { href: '/admin/bulletins', label: '주보' },
    { href: '/admin/events', label: '행사일정' },
    { href: '/admin/notices', label: '공지사항' },
    { href: '/admin/boards', label: '게시판' },
    { href: '/admin/pages', label: '페이지 문구' },
    { href: '/admin/history', label: '연혁' },
    { href: '/admin/people', label: '섬기는 분들' },
    { href: '/admin/missions', label: '선교지' },
    { href: '/admin/groups', label: '부서' },
    { href: '/admin/members', label: '회원' },
]

// 현재 경로가 메뉴 항목에 해당하는지 (쿼리 제외 경로 비교)
export function isMenuActive(pathname: string, href: string): boolean {
    const path = href.split('?')[0]
    return pathname === path || pathname.startsWith(`${path}/`)
}

// 한 메뉴 묶음에서 현재 화면에 해당하는 항목 하나 — 가장 구체적인 경로, 탭(쿼리)까지 맞는 항목 우선
// (/about/history에서 '환영합니다'(/about)까지 켜지거나, 다음세대 탭 항목이 모두 켜지는 것 방지)
export function activeItemHref(items: MenuItem[], pathname: string, search: string): string | null {
    const params = new URLSearchParams(search)
    let best: string | null = null
    let bestScore = -1
    for (const { href } of items) {
        const [path, query] = href.split('?')
        if (!isMenuActive(pathname, path)) continue
        if (query && ![...new URLSearchParams(query)].every(([key, value]) => params.get(key) === value)) continue
        const score = path.length + (query ? 0.5 : 0)
        if (score > bestScore) {
            best = href
            bestScore = score
        }
    }
    return best
}
