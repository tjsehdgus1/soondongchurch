import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin, getServiceClient } from '@/lib/admin'

// GET: 멤버 목록 (?group_id=X) 또는 전체 프로필 (?all=1)
export async function GET(req: NextRequest) {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const supabase = getServiceClient()

    if (searchParams.get('all') === '1') {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, email')
            .order('name')
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ profiles: data ?? [] })
    }

    const groupId = searchParams.get('group_id')
    if (!groupId) return NextResponse.json({ error: 'group_id가 필요합니다.' }, { status: 400 })

    const { data, error } = await supabase
        .from('group_members')
        .select('id, user_id, profiles(name, email)')
        .eq('group_id', Number(groupId))
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ members: data ?? [] })
}

// POST: 멤버 추가
export async function POST(req: NextRequest) {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

    const { group_id, user_id } = await req.json()
    if (!group_id || !user_id) return NextResponse.json({ error: '파라미터가 부족합니다.' }, { status: 400 })

    const supabase = getServiceClient()
    const { error } = await supabase.from('group_members').insert([{ group_id, user_id }])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
}

// DELETE: 멤버 제거
export async function DELETE(req: NextRequest) {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 })

    const supabase = getServiceClient()
    const { error } = await supabase.from('group_members').delete().eq('id', Number(id))
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
}
