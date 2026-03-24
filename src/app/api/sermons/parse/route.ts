import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

// Vercel 서버리스 타임아웃 연장 (AI 요약까지 처리 시간 확보)
export const maxDuration = 60

// youtube-transcript 라이브러리 제거 이유:
// Vercel은 AWS 데이터센터 IP를 사용하며, YouTube가 이 IP 대역을 봇으로 감지해 차단함.
// 로컬(일반 ISP IP)에서는 정상 동작하지만 프로덕션에서 자막 취득 불가.
// 해결: YouTube 내부 플레이어 데이터(ytInitialPlayerResponse)를 브라우저 헤더로 직접 파싱.
// YouTube InnerTube API를 사용한 자막 추출
// HTML 파싱 방식(ytInitialPlayerResponse 크롤링) 대신 YouTube 내부 API를 직접 호출
// - HTML 파싱: 페이지 구조 변경에 취약, 대용량 HTML JSON 파싱 실패 위험
// - InnerTube API: YouTube 프론트엔드가 실제로 사용하는 엔드포인트, 구조 안정적
// - INNERTUBE_API_KEY는 YouTube 웹 클라이언트에 공개 내장된 키 (비밀 키 아님)
const INNERTUBE_API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'

async function fetchYouTubeTranscript(videoId: string, preferLang = 'ko'): Promise<string> {
    // 1단계: InnerTube /player API로 플레이어 데이터 취득 (HTML 파싱 없음)
    const playerRes = await fetch(
        `https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_API_KEY}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'X-YouTube-Client-Name': '1',
                'X-YouTube-Client-Version': '2.20231219.04.00',
                'Origin': 'https://www.youtube.com',
                'Referer': `https://www.youtube.com/watch?v=${videoId}`,
            },
            body: JSON.stringify({
                videoId,
                context: {
                    client: {
                        clientName: 'WEB',
                        clientVersion: '2.20231219.04.00',
                        hl: 'ko',
                        gl: 'KR',
                    },
                },
            }),
        }
    )

    if (!playerRes.ok) throw new Error(`InnerTube 플레이어 요청 실패 (${playerRes.status})`)

    const playerData = await playerRes.json()
    const tracks: Array<{ languageCode: string; baseUrl: string }> =
        playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []

    console.log('[transcript] 트랙 수:', tracks.length, '언어 목록:', tracks.map((t: { languageCode: string }) => t.languageCode))

    if (!tracks.length) throw new Error('이 영상에는 자막 트랙이 없습니다')

    // 2단계: 선호 언어 → 첫 번째 트랙 순으로 자막 URL 선택
    const track = (preferLang ? tracks.find(t => t.languageCode === preferLang) : null) ?? tracks[0]
    console.log('[transcript] 선택 트랙:', track.languageCode)

    // 3단계: json3 포맷으로 자막 원문 요청
    const captionRes = await fetch(`${track.baseUrl}&fmt=json3`)
    if (!captionRes.ok) throw new Error(`자막 데이터 요청 실패 (${captionRes.status})`)

    const captionJson = await captionRes.json()
    const text = (captionJson.events ?? [])
        .filter((e: { segs?: Array<{ utf8?: string }> }) => e.segs)
        .flatMap((e: { segs: Array<{ utf8?: string }> }) => e.segs.map((s: { utf8?: string }) => s.utf8 ?? ''))
        .filter((s: string) => s.trim() !== '' && s !== '\n')
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

        const { youtubeUrl, sermonDate } = await req.json()

        // 1. 유튜브 ID 추출 (일반/라이브/쇼츠/모바일/단축 URL 모두 지원)
        const videoIdMatch = youtubeUrl.match(
            /(?:https?:\/\/)?(?:www\.|m\.)?youtu(?:be\.com\/(?:watch\?v=|live\/|shorts\/)|\.be\/)([\w-]{11})/
        )
        if (!videoIdMatch) {
            return NextResponse.json({ error: '올바르지 않은 유튜브 URL입니다.' }, { status: 400 })
        }
        const videoId = videoIdMatch[1]

        // 2. 유튜브 자막 추출 (한국어 우선, 실패 시 첫 번째 트랙으로 재시도)
        let transcriptText = ''
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
