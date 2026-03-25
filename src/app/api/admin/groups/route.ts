import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin, getServiceClient } from '@/lib/admin'

// GET: 소그룹 목록 + 멤버 수
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

    const result = (groups ?? []).map((g) => ({
        ...g,
        member_count: countMap[g.id] ?? 0,
    }))

    return NextResponse.json({ groups: result })
}

// POST: 소그룹 생성
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

// DELETE: 소그룹 삭제
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
