import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdmin } from '@/lib/admin'

// GET: 관리자용 전체 설교 목록 (draft 포함) — raw_transcript 제외 (대용량 필드)
export async function GET() {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })

    const supabase = await createClient()
    const { data, error: dbError } = await supabase
        .from('sermons')
        .select('id, youtube_id, title, sermon_date, summary, thumbnail_url, status, created_at')
        .order('sermon_date', { ascending: false })

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
    return NextResponse.json({ data })
}

// PUT: 설교 내용 수정
export async function PUT(req: Request) {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })

    const supabase = await createClient()
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
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })

    const supabase = await createClient()
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
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })

    const supabase = await createClient()
    const { id } = await req.json()
    const { error: dbError } = await supabase
        .from('sermons')
        .delete()
        .eq('id', id)

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
