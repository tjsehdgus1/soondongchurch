import { NextResponse } from 'next/server'
import { getServiceClient, verifyAdmin } from '@/lib/admin'
import { checkCsrf } from '@/lib/csrf'
import { isHubKey } from '@/lib/hubs'

const KINDS = ['list', 'card']
const WRITE_LEVELS = ['admin', 'group', 'member']

// 입력값 검증 후 저장 가능한 필드만 추출
function pickBoardFields(body: Record<string, unknown>): { updates: Record<string, unknown> } | { error: string } {
    const updates: Record<string, unknown> = {}
    if ('name' in body) {
        if (typeof body.name !== 'string' || !body.name.trim()) return { error: '게시판 이름을 입력해 주세요.' }
        updates.name = body.name.trim()
    }
    if ('hub' in body) {
        if (body.hub !== null && !isHubKey(body.hub as string)) return { error: '잘못된 메뉴 위치입니다.' }
        updates.hub = body.hub
        // section은 이전 메뉴용 필수 컬럼 — hub 값으로 채움
        updates.section = body.hub ?? '숨김'
    }
    if ('tab_order' in body) {
        if (!Number.isInteger(body.tab_order)) return { error: '탭 순서는 숫자여야 합니다.' }
        updates.tab_order = body.tab_order
    }
    if ('kind' in body) {
        if (!KINDS.includes(body.kind as string)) return { error: '잘못된 목록 형태입니다.' }
        updates.kind = body.kind
    }
    if ('write_level' in body) {
        if (!WRITE_LEVELS.includes(body.write_level as string)) return { error: '잘못된 글쓰기 권한입니다.' }
        updates.write_level = body.write_level
    }
    if ('group_id' in body) {
        if (body.group_id !== null && !Number.isInteger(body.group_id)) return { error: '잘못된 부서입니다.' }
        updates.group_id = body.group_id
    }
    if ('categories' in body) {
        if (!Array.isArray(body.categories) || body.categories.some((c) => typeof c !== 'string')) return { error: '잘못된 말머리입니다.' }
        updates.categories = (body.categories as string[]).map((c) => c.trim()).filter(Boolean)
    }
    if ('sort_order' in body) {
        if (!Number.isInteger(body.sort_order)) return { error: '정렬 순서는 숫자여야 합니다.' }
        updates.sort_order = body.sort_order
    }
    return { updates }
}

// GET: 게시판 목록 + 글쓰기 부서 선택용 소그룹 목록 + 게시판별 글 수
export async function GET() {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

    const service = getServiceClient()
    const [{ data: boards, error }, { data: groups }, { data: posts }] = await Promise.all([
        service.from('boards').select('*').order('hub').order('tab_order'),
        service.from('groups').select('id, name').order('name'),
        service.from('board_posts').select('board_id'),
    ])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const postCounts: Record<number, number> = {}
    for (const p of posts ?? []) postCounts[p.board_id] = (postCounts[p.board_id] ?? 0) + 1

    return NextResponse.json({ boards, groups: groups ?? [], postCounts })
}

// POST: 게시판 추가
export async function POST(req: Request) {
    if (!checkCsrf(req)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 403 })
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

    const body = await req.json()
    if (typeof body.slug !== 'string' || !/^[a-z0-9-]{2,40}$/.test(body.slug)) {
        return NextResponse.json({ error: '주소는 영문 소문자, 숫자, 하이픈(-) 2~40자로 입력해 주세요.' }, { status: 400 })
    }
    if (!body.name) return NextResponse.json({ error: '게시판 이름이 필요합니다.' }, { status: 400 })

    const picked = pickBoardFields(body)
    if ('error' in picked) return NextResponse.json({ error: picked.error }, { status: 400 })

    const { error } = await getServiceClient().from('boards').insert({ section: '숨김', ...picked.updates, slug: body.slug })
    if (error) {
        const message = error.code === '23505' ? '이미 사용 중인 주소입니다.' : error.message
        return NextResponse.json({ error: message }, { status: 400 })
    }
    return NextResponse.json({ success: true })
}

// PATCH: 게시판 수정 (?id=)
export async function PATCH(req: Request) {
    if (!checkCsrf(req)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 403 })
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

    const id = Number(new URL(req.url).searchParams.get('id'))
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: '유효한 id가 필요합니다.' }, { status: 400 })

    const picked = pickBoardFields(await req.json())
    if ('error' in picked) return NextResponse.json({ error: picked.error }, { status: 400 })
    if (Object.keys(picked.updates).length === 0) return NextResponse.json({ error: '변경할 항목이 없습니다.' }, { status: 400 })

    const { error } = await getServiceClient().from('boards').update(picked.updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}

// DELETE: 게시판 삭제 (?id=) — 글이 남아 있으면 거부
export async function DELETE(req: Request) {
    if (!checkCsrf(req)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 403 })
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

    const id = Number(new URL(req.url).searchParams.get('id'))
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: '유효한 id가 필요합니다.' }, { status: 400 })

    const service = getServiceClient()
    const { count } = await service.from('board_posts').select('id', { count: 'exact', head: true }).eq('board_id', id)
    if (count) return NextResponse.json({ error: `게시글 ${count}개가 남아 있어 삭제할 수 없습니다.` }, { status: 400 })

    const { error } = await service.from('boards').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
