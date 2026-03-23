import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getAdminClient() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { supabase: null, error: '로그인이 필요합니다.' }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { supabase: null, error: '관리자 권한이 필요합니다.' }
    return { supabase, error: null }
}

// GET: 관리자용 전체 설교 목록 (draft 포함)
export async function GET() {
    const { supabase, error } = await getAdminClient()
    if (!supabase) return NextResponse.json({ error }, { status: 401 })

    const { data, error: dbError } = await supabase
        .from('sermons')
        .select('*')
        .order('sermon_date', { ascending: false })

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
    return NextResponse.json({ data })
}

// PUT: 설교 내용 수정
export async function PUT(req: Request) {
    const { supabase, error } = await getAdminClient()
    if (!supabase) return NextResponse.json({ error }, { status: 401 })

    const { id, title, sermon_date, summary } = await req.json()
    const { error: dbError } = await supabase
        .from('sermons')
        .update({ title, sermon_date, summary })
        .eq('id', id)

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
    return NextResponse.json({ success: true })
}

// PATCH: 발행 상태 토글
export async function PATCH(req: Request) {
    const { supabase, error } = await getAdminClient()
    if (!supabase) return NextResponse.json({ error }, { status: 401 })

    const { id, status } = await req.json()
    const { error: dbError } = await supabase
        .from('sermons')
        .update({ status })
        .eq('id', id)

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
    return NextResponse.json({ success: true })
}

// DELETE: 설교 삭제
export async function DELETE(req: Request) {
    const { supabase, error } = await getAdminClient()
    if (!supabase) return NextResponse.json({ error }, { status: 401 })

    const { id } = await req.json()
    const { error: dbError } = await supabase
        .from('sermons')
        .delete()
        .eq('id', id)

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
