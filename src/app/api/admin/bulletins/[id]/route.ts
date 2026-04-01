import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, verifyAdmin } from '@/lib/admin'
import { checkCsrf } from '@/lib/csrf'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!checkCsrf(req)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 403 })

    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

    const { id } = await params
    const supabase = getServiceClient()

    const { data: bulletin } = await supabase
        .from('bulletins')
        .select('file_path')
        .eq('id', id)
        .single()

    if (bulletin?.file_path) {
        await supabase.storage.from('bulletins').remove([bulletin.file_path])
    }

    const { error } = await supabase.from('bulletins').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
}
