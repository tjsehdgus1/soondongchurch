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
