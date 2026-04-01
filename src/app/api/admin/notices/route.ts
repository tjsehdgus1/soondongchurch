import { NextResponse } from 'next/server'
import { getServiceClient, verifyAdmin } from '@/lib/admin'
import { checkCsrf } from '@/lib/csrf'

export async function GET() {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

    const service = getServiceClient()
    const { data, error } = await service
        .from('notices')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ notices: data })
}

export async function POST(req: Request) {
    if (!checkCsrf(req)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 403 })

    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

    const { title, content, is_pinned, author_id, author_name } = await req.json()
    if (!title || !content) return NextResponse.json({ error: '제목과 내용이 필요합니다.' }, { status: 400 })

    const service = getServiceClient()
    const { error } = await service.from('notices').insert([{ title, content, is_pinned: !!is_pinned, author_id, author_name }])

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}

export async function PATCH(req: Request) {
    if (!checkCsrf(req)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 403 })

    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id || isNaN(Number(id))) return NextResponse.json({ error: '유효한 id가 필요합니다.' }, { status: 400 })

    const body = await req.json()
    // 허용된 필드만 업데이트 (필드 화이트리스트)
    const allowed = ['title', 'content', 'is_pinned'] as const
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
        if (key in body) updates[key] = body[key]
    }
    if (Object.keys(updates).length === 0) return NextResponse.json({ error: '변경할 항목이 없습니다.' }, { status: 400 })

    const service = getServiceClient()
    const { error } = await service.from('notices').update(updates).eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
    if (!checkCsrf(req)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 403 })

    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id || isNaN(Number(id))) return NextResponse.json({ error: '유효한 id가 필요합니다.' }, { status: 400 })

    const service = getServiceClient()
    const { error } = await service.from('notices').delete().eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
