import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, verifyAdmin } from '@/lib/admin'

export async function POST(req: NextRequest) {
    try {
        const admin = await verifyAdmin()
        if (!admin) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

        const { filePath } = await req.json()
        if (!filePath) return NextResponse.json({ error: 'filePath가 없습니다.' }, { status: 400 })

        const supabase = getServiceClient()
        const { data, error } = await supabase.storage
            .from('bulletins')
            .createSignedUploadUrl(filePath)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ signedUrl: data.signedUrl, token: data.token, path: data.path })
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : '서버 오류' }, { status: 500 })
    }
}
