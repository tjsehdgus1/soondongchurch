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

// 주보 목록
export async function GET() {
    const supabase = getServiceClient()
    const { data, error } = await supabase
        .from('bulletins')
        .select('*')
        .order('bulletin_date', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ bulletins: data })
}

// 주보 메타데이터 저장 (파일은 클라이언트에서 직접 업로드)
export async function POST(req: NextRequest) {
    try {
        const admin = await verifyAdmin()
        if (!admin) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

        const { title, bulletinDate, filePath } = await req.json()

        if (!title || !bulletinDate || !filePath) {
            return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
        }

        const supabase = getServiceClient()
        const { data: { publicUrl } } = supabase.storage.from('bulletins').getPublicUrl(filePath)

        const { data, error: dbError } = await supabase
            .from('bulletins')
            .insert({ title, bulletin_date: bulletinDate, file_url: publicUrl, file_path: filePath })
            .select()
            .single()

        if (dbError) {
            console.error('[bulletins POST] DB 오류:', dbError)
            return NextResponse.json({ error: `DB 오류: ${dbError.message}` }, { status: 500 })
        }

        return NextResponse.json({ bulletin: data })
    } catch (err) {
        console.error('[bulletins POST] 예외 발생:', err)
        return NextResponse.json({ error: `서버 오류: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 })
    }
}
