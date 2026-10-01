import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/admin'

// 회원 전용 글의 이미지 (board-private 버킷, 비공개)
// 로그인한 회원에게만 짧은 서명 URL로 전달
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params
    const filePath = path.join('/')
    if (path.some((seg) => seg === '..' || seg === '')) {
        return NextResponse.json({ error: '잘못된 경로입니다.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: isMember } = await supabase.rpc('is_active_member')
    if (!isMember) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const { data, error } = await getServiceClient().storage
        .from('board-private')
        .createSignedUrl(filePath, 60 * 10)
    if (error || !data) return NextResponse.json({ error: '이미지를 찾을 수 없습니다.' }, { status: 404 })

    const res = NextResponse.redirect(data.signedUrl)
    // 회원별 응답이므로 공유 캐시 금지
    res.headers.set('Cache-Control', 'private, max-age=300')
    return res
}
