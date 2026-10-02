// 관리자가 사용자 화면에서 바로 갈 수 있는 관리 화면 (화면 오른쪽 아래 관리자 버튼)
// 글 단위 수정·삭제는 각 화면에 직접 둠 — 게시판 글, 공지 상세, 행사일정, 주보 상세

export type AdminLink = { href: string, label: string }

// 사이트 설정 관리자만 들어갈 수 있는 화면 (src/app/admin/(site))
const SITE_ONLY = ['/admin/pages', '/admin/boards', '/admin/history', '/admin/people', '/admin/missions']

const PAGES: AdminLink = { href: '/admin/pages', label: '페이지 문구 수정' }
const BOARDS: AdminLink = { href: '/admin/boards', label: '게시판 관리' }

export function adminLinksFor(pathname: string, canManageSite: boolean): AdminLink[] {
    return linksFor(pathname).filter((link) => canManageSite || !SITE_ONLY.includes(link.href))
}

function linksFor(pathname: string): AdminLink[] {
    if (pathname.startsWith('/admin') || pathname.startsWith('/auth')) return []
    if (pathname === '/about/history') return [{ href: '/admin/history', label: '연혁 수정' }]
    if (pathname === '/about/people') return [{ href: '/admin/people', label: '섬기는 분들 수정' }]
    if (pathname === '/mission') return [{ href: '/admin/missions', label: '선교지 수정' }, PAGES, BOARDS]
    if (['/', '/about', '/worship', '/directions'].includes(pathname)) return [PAGES]
    if (['/sermons', '/praise', '/next-gen', '/fellowship', '/discipleship'].includes(pathname)) return [PAGES, BOARDS]
    if (pathname === '/board' || pathname.startsWith('/board/')) return [BOARDS]
    if (pathname === '/notices') return [{ href: '/admin/notices', label: '공지사항 쓰기' }]
    if (pathname.startsWith('/notices/')) return [{ href: '/admin/notices', label: '공지사항 관리' }]
    if (pathname === '/events') return [{ href: '/admin/events', label: '행사일정 추가' }]
    if (pathname === '/bulletins' || pathname.startsWith('/bulletins/')) return [{ href: '/admin/bulletins', label: '주보 올리기' }]
    return []
}
