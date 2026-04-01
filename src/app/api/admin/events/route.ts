import { NextResponse } from 'next/server'
import { getServiceClient, verifyAdmin } from '@/lib/admin'
import { checkCsrf } from '@/lib/csrf'

export async function GET() {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

    const service = getServiceClient()
    const { data, error } = await service
        .from('events')
        .select('*')
        .order('event_date', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ events: data })
}

export async function POST(req: Request) {
    if (!checkCsrf(req)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 403 })

    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

    const { title, event_type, event_date, event_time, location, description } = await req.json()
    if (!title || !event_date) return NextResponse.json({ error: '제목과 날짜가 필요합니다.' }, { status: 400 })

    const service = getServiceClient()
    const { error } = await service.from('events').insert([{
        title,
        event_type,
        event_date,
        event_time: event_time || null,
        location: location || null,
        description: description || null,
    }])

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
    const { error } = await service.from('events').delete().eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
