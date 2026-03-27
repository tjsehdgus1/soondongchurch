import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

// Vercel 서버리스 타임아웃 연장 (AI 요약까지 처리 시간 확보)
export const maxDuration = 60

// youtube-transcript 라이브러리 제거 이유:
// Vercel은 AWS 데이터센터 IP를 사용하며, YouTube가 이 IP 대역을 봇으로 감지해 차단함.
// 로컬(일반 ISP IP)에서는 정상 동작하지만 프로덕션에서 자막 취득 불가.
// 해결: YouTube 내부 플레이어 데이터(ytInitialPlayerResponse)를 브라우저 헤더로 직접 파싱.
// youtube-transcript 라이브러리 소스 분석 결과:
// - API 키 없이 ?prettyPrint=false 만 사용
// - 클라이언트 버전 20.10.38 (최신)
// - 자막 URL 요청 시 반드시 User-Agent 헤더 포함 (없으면 0 bytes 반환)
const ANDROID_UA = 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)'
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)'

async function fetchYouTubeTranscript(videoId: string, preferLang = 'ko'): Promise<string> {
    // 1단계: InnerTube ANDROID 클라이언트로 captionTracks 취득
    const playerRes = await fetch(
        'https://www.youtube.com/youtubei/v1/player?prettyPrint=false',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'User-Agent': ANDROID_UA },
            body: JSON.stringify({
                context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38' } },
                videoId,
            }),
        }
    )

    if (!playerRes.ok) throw new Error(`InnerTube 요청 실패 (${playerRes.status})`)

    const playerData = await playerRes.json()
    const tracks: Array<{ languageCode: string; baseUrl: string }> =
        playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []

    console.log('[transcript] 트랙 수:', tracks.length, '언어:', tracks.map((t: { languageCode: string }) => t.languageCode))

    if (!tracks.length) throw new Error('이 영상에는 자막 트랙이 없습니다')

    // 2단계: 선호 언어 → 첫 번째 트랙 선택
    const track = (preferLang ? tracks.find(t => t.languageCode === preferLang) : null) ?? tracks[0]
    console.log('[transcript] 선택 트랙:', track.languageCode)

    // 3단계: 자막 URL 요청 — User-Agent 없으면 YouTube가 0 bytes 반환
    const captionRes = await fetch(track.baseUrl, {
        headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': preferLang || 'ko' },
    })
    if (!captionRes.ok) throw new Error(`자막 데이터 요청 실패 (${captionRes.status})`)

    const xml = await captionRes.text()
    console.log('[transcript] XML 길이:', xml.length)

    // XML에서 텍스트 추출 (<text> 또는 <p><s> 두 가지 포맷 처리)
    const texts: string[] = []
    const tagRegex = /<text[^>]*>([^<]*)<\/text>|<p[^>]*>[\s\S]*?<\/p>/g
    const segRegex = /<s[^>]*>([^<]*)<\/s>/g
    let m: RegExpExecArray | null

    while ((m = tagRegex.exec(xml)) !== null) {
        if (m[1] !== undefined) {
            // <text> 포맷
            texts.push(m[1])
        } else {
            // <p><s> 포맷
            let seg: RegExpExecArray | null
            segRegex.lastIndex = 0
            while ((seg = segRegex.exec(m[0])) !== null) texts.push(seg[1])
        }
    }

    const text = texts
        .map(t => t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim())
        .filter(t => t)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()

    console.log('[transcript] 텍스트 길이:', text.length)
    if (!text) throw new Error('자막 내용이 비어 있습니다')
    return text
}

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

        const { youtubeUrl, sermonDate, transcript: clientTranscript } = await req.json()

        // 1. 유튜브 ID 추출 (일반/라이브/쇼츠/모바일/단축 URL 모두 지원)
        const videoIdMatch = youtubeUrl.match(
            /(?:https?:\/\/)?(?:www\.|m\.)?youtu(?:be\.com\/(?:watch\?v=|live\/|shorts\/)|\.be\/)([\w-]{11})/
        )
        if (!videoIdMatch) {
            return NextResponse.json({ error: '올바르지 않은 유튜브 URL입니다.' }, { status: 400 })
        }
        const videoId = videoIdMatch[1]

        // 2. 자막 취득
        // - clientTranscript: 클라이언트(Edge /transcript 라우트)에서 미리 가져온 자막 (Vercel 프로덕션)
        // - 없으면 서버에서 직접 시도 (로컬 개발 환경)
        let transcriptText = clientTranscript || ''
        if (!transcriptText) {
            try {
                transcriptText = await fetchYouTubeTranscript(videoId, 'ko')
            } catch (firstErr) {
                console.warn('[transcript] 한국어 자막 실패, 재시도:', firstErr)
                try {
                    transcriptText = await fetchYouTubeTranscript(videoId, '')
                } catch (err) {
                    console.error('[transcript] 자막 추출 최종 실패:', err)
                    const reason = err instanceof Error ? err.message : String(err)
                    return NextResponse.json({ error: `유튜브 자막을 가져올 수 없습니다. (${reason})` }, { status: 500 })
                }
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

        // 4. Gemini API 연동 (요약 + 태그 생성)
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

        const prompt = `다음은 교회 설교 영상의 전체 자막입니다.
설교를 분석하여 아래 JSON 형식으로만 응답해주세요. 다른 텍스트는 포함하지 마세요.

{
  "summary": "설교 핵심 메시지를 100자 이내 한 문장으로 (정중한 격식체, ~입니다)",
  "tags": ["성경 본문", "주제", "키워드", ...] // 3~7개, 한국어
}

태그 예시: ["로마서 8장", "성령", "구원", "감사", "부활절"]

설교 자막:
${transcriptText}`

        const result = await model.generateContent(prompt)
        const rawText = result.response.text().trim()

        // JSON 파싱 (마크다운 코드 블록 제거)
        const jsonText = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim()
        const parsed = JSON.parse(jsonText)
        const summary: string = parsed.summary || ''
        const tags: string[] = Array.isArray(parsed.tags) ? parsed.tags : []

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
                status: 'draft',
                tags: tags
            }, { onConflict: 'youtube_id' })
            .select()

        if (error) {
            console.error("DB 저장 실패:", error)
            return NextResponse.json({ error: '데이터베이스 저장 중 오류가 발생했습니다.' }, { status: 500 })
        }

        return NextResponse.json({ success: true, data: data[0] })

    } catch (error: unknown) {
        console.error("서버 내부 오류:", error)
        return NextResponse.json({ error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.' }, { status: 500 })
    }
}
