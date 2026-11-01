// 홈페이지 계정 역할 (profiles.role) — 실제 권한은 DB 함수 is_admin()·is_editor()·can_write_board()가 검사
// member: 일반 회원 / editor: 운영자(모든 게시판 글쓰기, 수정·삭제는 자기 글만, 관리자 화면 없음) / admin: 관리자
export const ROLES = ['member', 'editor', 'admin'] as const

export type Role = (typeof ROLES)[number]

export const ROLE_LABEL: Record<Role, string> = {
    member: '일반 회원',
    editor: '운영자',
    admin: '관리자',
}

export function isRole(value: unknown): value is Role {
    return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}
