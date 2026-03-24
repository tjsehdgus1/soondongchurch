import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
}

async function verifyAdmin() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return null
    return user
}

export async function POST(req: NextRequest) {
    try {
        const admin = await verifyAdmin()
        if (!admin) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

        const { filePath } = await req.json()
        if (!filePath) return NextResponse.json({ error: 'filePath가 없습니다.' }, { status: 400 })

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!supabaseUrl || !serviceKey) {
            console.error('[presign] 환경변수 누락:', { supabaseUrl: !!supabaseUrl, serviceKey: !!serviceKey })
            return NextResponse.json({ error: '서버 환경변수가 설정되지 않았습니다.' }, { status: 500 })
        }

        const supabase = getServiceClient()
        const { data, error } = await supabase.storage
            .from('bulletins')
            .createSignedUploadUrl(filePath)

        if (error) {
            console.error('[presign] Supabase 오류:', error)
            return NextResponse.json({ error: `스토리지 오류: ${error.message}` }, { status: 500 })
        }

        return NextResponse.json({ signedUrl: data.signedUrl, token: data.token, path: data.path })
    } catch (err) {
        console.error('[presign] 예외 발생:', err)
        return NextResponse.json({ error: `서버 오류: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 })
    }
}
