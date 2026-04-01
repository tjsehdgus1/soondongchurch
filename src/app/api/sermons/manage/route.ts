import { NextResponse } from 'next/server'
import { getServiceClient, verifyAdmin } from '@/lib/admin'
import { checkCsrf } from '@/lib/csrf'

// GET: 관리자용 전체 설교 목록 (draft 포함) — raw_transcript 제외 (대용량 필드)
export async function GET() {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })

    const supabase = getServiceClient()
    const { data, error: dbError } = await supabase
        .from('sermons')
        .select('id, youtube_id, title, sermon_date, summary, thumbnail_url, status, created_at, tags')
        .order('sermon_date', { ascending: false })

    if (dbError) return NextResponse.json({ error: '데이터를 불러오는 중 오류가 발생했습니다.' }, { status: 500 })
    return NextResponse.json({ data })
}

// PUT: 설교 내용 수정
export async function PUT(req: Request) {
    if (!checkCsrf(req)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 403 })

    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })

    const supabase = getServiceClient()
    const { id, title, sermon_date, summary, tags } = await req.json()

    const { data, error: dbError } = await supabase
        .from('sermons')
        .update({ title, sermon_date, summary, tags: tags ?? [] })
        .eq('id', id)
        .select()

    if (dbError) {
        console.error('sermon update error:', dbError.code)
        return NextResponse.json({ error: '저장 중 오류가 발생했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
}

// PATCH: 발행 상태 토글
export async function PATCH(req: Request) {
    if (!checkCsrf(req)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 403 })

    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })

    const supabase = getServiceClient()
    const { id, status } = await req.json()
    const { error: dbError } = await supabase
        .from('sermons')
        .update({ status })
        .eq('id', id)

    if (dbError) return NextResponse.json({ error: '저장 중 오류가 발생했습니다.' }, { status: 500 })
    return NextResponse.json({ success: true })
}

// DELETE: 설교 삭제
export async function DELETE(req: Request) {
    if (!checkCsrf(req)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 403 })

    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })

    const supabase = getServiceClient()
    const { id } = await req.json()
    const { error: dbError } = await supabase
        .from('sermons')
        .delete()
        .eq('id', id)

    if (dbError) return NextResponse.json({ error: '삭제 중 오류가 발생했습니다.' }, { status: 500 })
    return NextResponse.json({ success: true })
}
