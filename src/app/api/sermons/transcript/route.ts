// Edge 런타임: AWS Lambda와 다른 IP 대역 사용
// Vercel Edge는 YouTube의 서버리스(AWS) IP 차단과 별개로 동작할 가능성이 높음
export const runtime = 'edge'

const ANDROID_UA = 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)'
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)'

export async function POST(req: Request) {
    try {
        const { videoId, lang = 'ko' } = await req.json()
        if (!videoId) return Response.json({ error: 'videoId 필요' }, { status: 400 })

        // 1. InnerTube ANDROID 클라이언트로 captionTracks 취득
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

        if (!playerRes.ok) {
            return Response.json({ error: `InnerTube 요청 실패 (${playerRes.status})` }, { status: 502 })
        }

        const playerData = await playerRes.json() as {
            captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: Array<{ languageCode: string; baseUrl: string }> } }
        }
        const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []

        if (!tracks.length) {
            return Response.json({ error: '이 영상에는 자막 트랙이 없습니다' }, { status: 404 })
        }

        // 2. 선호 언어 → 첫 번째 트랙 선택
        const track = (lang ? tracks.find(t => t.languageCode === lang) : null) ?? tracks[0]

        // 3. 자막 XML 요청 (User-Agent 필수 — 없으면 0 bytes)
        const captionRes = await fetch(track.baseUrl, {
            headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': lang || 'ko' },
        })

        if (!captionRes.ok) {
            return Response.json({ error: `자막 데이터 요청 실패 (${captionRes.status})` }, { status: 502 })
        }

        const xml = await captionRes.text()

        // 4. XML 파싱 (<text> 또는 <p><s> 두 가지 포맷 처리)
        const texts: string[] = []
        const tagRegex = /<text[^>]*>([^<]*)<\/text>|<p[^>]*>([\s\S]*?)<\/p>/g
        const segRegex = /<s[^>]*>([^<]*)<\/s>/g
        let m: RegExpExecArray | null

        while ((m = tagRegex.exec(xml)) !== null) {
            if (m[1] !== undefined) {
                texts.push(m[1])
            } else if (m[2] !== undefined) {
                let seg: RegExpExecArray | null
                const inner = m[2]
                segRegex.lastIndex = 0
                while ((seg = segRegex.exec(inner)) !== null) texts.push(seg[1])
            }
        }

        const transcript = texts
            .map(t => t
                .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                .replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim()
            )
            .filter(t => t)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim()

        if (!transcript) {
            return Response.json({ error: '자막 내용이 비어 있습니다' }, { status: 404 })
        }

        return Response.json({ transcript, lang: track.languageCode })

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return Response.json({ error: msg }, { status: 500 })
    }
}
