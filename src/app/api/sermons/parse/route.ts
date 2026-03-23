import { NextResponse } from 'next/server'
import { YoutubeTranscript } from 'youtube-transcript'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        // 0. 관리자 인증 체크
        const supabaseAuth = await createClient()
        const { data: { user } } = await supabaseAuth.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
        }
        const { data: profile } = await supabaseAuth.from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
        }

        const { youtubeUrl, sermonDate } = await req.json()

        // 1. 유튜브 ID 추출 (일반/라이브/쇼츠/모바일/단축 URL 모두 지원)
        const videoIdMatch = youtubeUrl.match(
            /(?:https?:\/\/)?(?:www\.|m\.)?youtu(?:be\.com\/(?:watch\?v=|live\/|shorts\/)|\.be\/)([\w-]{11})/
        )
        if (!videoIdMatch) {
            return NextResponse.json({ error: '올바르지 않은 유튜브 URL입니다.' }, { status: 400 })
        }
        const videoId = videoIdMatch[1]

        // 2. 유튜브 자막 추출 (한국어 우선, 실패 시 기본 언어로 재시도)
        let transcriptText = ""
        try {
            const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'ko' })
            transcriptText = transcript.map(t => t.text).join(' ')
        } catch {
            try {
                const transcript = await YoutubeTranscript.fetchTranscript(videoId)
                transcriptText = transcript.map(t => t.text).join(' ')
            } catch (err) {
                console.error("자막 추출 실패:", err)
                return NextResponse.json({ error: '유튜브 자막을 가져올 수 없습니다. 영상의 자막(CC) 설정을 확인해주세요.' }, { status: 500 })
            }
        }

        // 3. YouTube oEmbed로 영상 제목 가져오기
        let videoTitle = '새 설교 (검토 필요)'
        try {
            const oembedRes = await fetch(
                `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
            )
            if (oembedRes.ok) {
                const oembedData = await oembedRes.json()
                if (oembedData.title) videoTitle = oembedData.title
            }
        } catch {
            // 제목 가져오기 실패 시 기본값 유지
        }

        // 4. Gemini API 연동 (요약 생성)
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

        const prompt = `다음은 교회 설교 영상의 전체 자막입니다.
이 설교의 핵심 메시지를 100자 이내로 간결하게 한 문장으로 요약해 주세요.
정중한 격식체(~입니다)를 사용하고, 성경적 핵심 내용을 담아 주세요.
불필요한 설명 없이 핵심만 담은 한 문장으로만 답해 주세요.

설교 자막:
${transcriptText}`

        const result = await model.generateContent(prompt)
        const summary = result.response.text()

        // 5. Supabase DB에 임시 저장 (Draft 상태)
        const supabase = supabaseAuth

        const thumbnail_url = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

        const { data, error } = await supabase
            .from('sermons')
            .upsert({
                youtube_id: videoId,
                title: videoTitle,
                sermon_date: sermonDate || new Date().toISOString().split('T')[0],
                summary: summary,
                raw_transcript: transcriptText,
                thumbnail_url: thumbnail_url,
                status: 'draft'
            }, { onConflict: 'youtube_id' })
            .select()

        if (error) {
            console.error("DB 저장 실패:", error)
            return NextResponse.json({ error: '데이터베이스 저장 중 오류가 발생했습니다.' }, { status: 500 })
        }

        return NextResponse.json({ success: true, data: data[0] })

    } catch (error: any) {
        console.error("서버 내부 오류:", error)
        return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 })
    }
}
