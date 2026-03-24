import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

// Vercel 서버리스 타임아웃 연장 (AI 요약까지 처리 시간 확보)
export const maxDuration = 60

// youtube-transcript 라이브러리 제거 이유:
// Vercel은 AWS 데이터센터 IP를 사용하며, YouTube가 이 IP 대역을 봇으로 감지해 차단함.
// 로컬(일반 ISP IP)에서는 정상 동작하지만 프로덕션에서 자막 취득 불가.
// 해결: YouTube 내부 플레이어 데이터(ytInitialPlayerResponse)를 브라우저 헤더로 직접 파싱.
// WEB 클라이언트는 서버 환경에서 YouTube가 봇으로 인식해 captionTracks를 숨김
// ANDROID 클라이언트는 앱 트래픽으로 인식되어 자막 포함 전체 응답을 반환함
const INNERTUBE_CLIENTS = [
    {
        // 1순위: ANDROID — 자막 데이터 포함 응답이 안정적
        apiKey: 'AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip',
            'X-YouTube-Client-Name': '3',
            'X-YouTube-Client-Version': '19.09.37',
        },
        body: (videoId: string) => ({
            videoId,
            context: {
                client: {
                    clientName: 'ANDROID',
                    clientVersion: '19.09.37',
                    androidSdkVersion: 30,
                    hl: 'ko', gl: 'KR',
                },
            },
        }),
    },
    {
        // 2순위: TVHTML5_SIMPLY_EMBEDDED_PLAYER — 임베드 플레이어, 봇 감지 낮음
        apiKey: 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/6.0 TV Safari/538.1',
            'X-YouTube-Client-Name': '85',
            'X-YouTube-Client-Version': '2.0',
        },
        body: (videoId: string) => ({
            videoId,
            context: {
                client: {
                    clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
                    clientVersion: '2.0',
                    hl: 'ko', gl: 'KR',
                },
            },
        }),
    },
]

async function fetchYouTubeTranscript(videoId: string, preferLang = 'ko'): Promise<string> {
    let tracks: Array<{ languageCode: string; baseUrl: string }> = []

    // 클라이언트 타입을 순서대로 시도해 captionTracks가 있는 응답을 찾음
    for (const client of INNERTUBE_CLIENTS) {
        const res = await fetch(
            `https://www.youtube.com/youtubei/v1/player?key=${client.apiKey}`,
            { method: 'POST', headers: client.headers, body: JSON.stringify(client.body(videoId)) }
        )
        if (!res.ok) { console.warn(`[transcript] 클라이언트 요청 실패 (${res.status})`); continue }

        const data = await res.json()
        const found: Array<{ languageCode: string; baseUrl: string }> =
            data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []

        console.log(`[transcript] 클라이언트 시도 → 트랙 ${found.length}개:`, found.map((t: { languageCode: string }) => t.languageCode))

        if (found.length > 0) { tracks = found; break }
    }

    if (!tracks.length) throw new Error('이 영상에는 자막 트랙이 없습니다')

    const track = (preferLang ? tracks.find(t => t.languageCode === preferLang) : null) ?? tracks[0]
    console.log('[transcript] 선택 트랙:', track.languageCode)

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
