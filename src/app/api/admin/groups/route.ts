import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin, getServiceClient } from '@/lib/admin'
import { checkCsrf } from '@/lib/csrf'

// GET: 부서 목록 + 멤버 수 + 연결된 게시판(board_ids) + 연결할 수 있는 부서 게시판 목록
export async function GET() {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

    const supabase = getServiceClient()
    const { data: groups, error: gErr } = await supabase
        .from('groups')
        .select('id, name, description, created_at')
        .order('created_at', { ascending: false })

    if (gErr) return NextResponse.json({ error: gErr.message }, { status: 500 })

    // 전체 group_members를 한 번에 가져와서 클라이언트에서 집계 (N+1 방지)
    const { data: members, error: mErr } = await supabase
        .from('group_members')
        .select('group_id')

    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })

    const countMap: Record<number, number> = {}
    members?.forEach((m) => {
        countMap[m.group_id] = (countMap[m.group_id] ?? 0) + 1
    })

    // 글쓰기 권한이 '부서'인 게시판만 연결 대상
    const [{ data: links, error: lErr }, { data: boards, error: bErr }] = await Promise.all([
        supabase.from('board_groups').select('board_id, group_id'),
        supabase.from('boards').select('id, name, hub, tab_order').eq('write_level', 'group').order('hub').order('tab_order'),
    ])
    if (lErr || bErr) return NextResponse.json({ error: (lErr ?? bErr)!.message }, { status: 500 })

    const boardMap: Record<number, number[]> = {}
    links?.forEach((l) => {
        (boardMap[l.group_id] ??= []).push(l.board_id)
    })

    const result = (groups ?? []).map((g) => ({
        ...g,
        member_count: countMap[g.id] ?? 0,
        board_ids: boardMap[g.id] ?? [],
    }))

    return NextResponse.json({ groups: result, boards: boards ?? [] })
}

// PATCH: 부서가 글 쓸 게시판 연결 (?id=부서, body { board_ids }) — 보낸 목록으로 통째로 바꿈
export async function PATCH(req: NextRequest) {
    if (!checkCsrf(req)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 403 })
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

    const id = Number(new URL(req.url).searchParams.get('id'))
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: '유효한 id가 필요합니다.' }, { status: 400 })

    const { board_ids } = await req.json()
    if (!Array.isArray(board_ids) || board_ids.some((b) => !Number.isInteger(b))) {
        return NextResponse.json({ error: '잘못된 게시판 목록입니다.' }, { status: 400 })
    }
    const ids = [...new Set(board_ids as number[])]

    const supabase = getServiceClient()
    if (ids.length > 0) {
        const { data: allowed, error } = await supabase.from('boards').select('id').eq('write_level', 'group').in('id', ids)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        if ((allowed ?? []).length !== ids.length) {
            return NextResponse.json({ error: "글쓰기 권한이 '부서'인 게시판만 연결할 수 있습니다." }, { status: 400 })
        }
    }

    // 빠진 연결 지우고, 새 연결 추가 (이미 있는 건 그대로)
    let remove = supabase.from('board_groups').delete().eq('group_id', id)
    if (ids.length > 0) remove = remove.not('board_id', 'in', `(${ids.join(',')})`)
    const { error: dErr } = await remove
    if (dErr) return NextResponse.json({ error: dErr.message }, { status: 500 })

    if (ids.length > 0) {
        const { error: iErr } = await supabase.from('board_groups')
            .upsert(ids.map((board_id) => ({ board_id, group_id: id })), { onConflict: 'board_id,group_id', ignoreDuplicates: true })
        if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}

// POST: 부서 생성
export async function POST(req: NextRequest) {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

    const { name, description } = await req.json()
    if (!name) return NextResponse.json({ error: '그룹 이름이 필요합니다.' }, { status: 400 })

    const supabase = getServiceClient()
    const { error } = await supabase.from('groups').insert([{ name, description: description ?? '' }])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
}

// DELETE: 부서 삭제
export async function DELETE(req: NextRequest) {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 })

    const supabase = getServiceClient()
    const { error } = await supabase.from('groups').delete().eq('id', Number(id))
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
}
