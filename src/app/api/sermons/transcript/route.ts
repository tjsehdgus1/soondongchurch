import { createServerClient } from '@supabase/ssr'

export const runtime = 'edge'

export async function POST(req: Request) {
    try {
        // Edge 런타임에서 쿠키 기반 관리자 인증
        const cookieHeader = req.headers.get('cookie') || ''
        const cookieEntries = cookieHeader.split('; ').filter(Boolean).map(c => {
            const idx = c.indexOf('=')
            return { name: c.slice(0, idx), value: c.slice(idx + 1) }
        })
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieEntries, setAll: () => {} } }
        )
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role !== 'admin') return Response.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })

        const { videoId, lang = 'ko' } = await req.json()
        if (!videoId) return Response.json({ error: 'videoId 필요' }, { status: 400 })

        const apiKey = process.env.SUPADATA_API_KEY
        if (!apiKey) return Response.json({ error: 'SUPADATA_API_KEY 환경변수가 설정되지 않았습니다.' }, { status: 500 })

        // Supadata YouTube Transcript API
        const url = `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&lang=${lang}&text=true`
        const res = await fetch(url, {
            headers: { 'x-api-key': apiKey },
        })

        if (!res.ok) {
            const body = await res.text().catch(() => '')
            if (res.status === 404) {
                return Response.json({ error: '이 영상에는 자막 트랙이 없습니다' }, { status: 404 })
            }
            return Response.json({ error: `자막 API 오류 (${res.status}): ${body.slice(0, 200)}` }, { status: 502 })
        }

        const data = await res.json() as { content?: string; lang?: string }

        const transcript = (data.content ?? '').trim()
        if (!transcript) {
            return Response.json({ error: '자막 내용이 비어 있습니다' }, { status: 404 })
        }

        return Response.json({ transcript, lang: data.lang ?? lang })

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return Response.json({ error: msg }, { status: 500 })
    }
}
