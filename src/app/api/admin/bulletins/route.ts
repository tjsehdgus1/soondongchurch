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

// 주보 업로드
export async function POST(req: NextRequest) {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

    const formData = await req.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const bulletinDate = formData.get('bulletinDate') as string

    if (!file || !title || !bulletinDate) {
        return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const filePath = `${bulletinDate}_${Date.now()}.pdf`

    const { error: uploadError } = await supabase.storage
        .from('bulletins')
        .upload(filePath, file, { contentType: 'application/pdf', upsert: false })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: { publicUrl } } = supabase.storage.from('bulletins').getPublicUrl(filePath)

    const { data, error: dbError } = await supabase
        .from('bulletins')
        .insert({ title, bulletin_date: bulletinDate, file_url: publicUrl, file_path: filePath })
        .select()
        .single()

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

    return NextResponse.json({ bulletin: data })
}
