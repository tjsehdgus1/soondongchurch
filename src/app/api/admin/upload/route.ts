import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { getServiceClient, verifySiteManager } from '@/lib/admin'
import { checkCsrf } from '@/lib/csrf'

const SCOPES = ['pages', 'timeline', 'people', 'missions']
const MAX_BYTES = 15 * 1024 * 1024

// POST: 콘텐츠 이미지 업로드 → 1920px webp 변환 후 저장, 표시용 URL 반환
// private=true(섬기는 분들만)면 비공개 버킷 + /api/board-images 경유 주소
export async function POST(req: Request) {
    if (!checkCsrf(req)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 403 })
    if (!(await verifySiteManager())) return NextResponse.json({ error: '사이트 설정 관리자만 올릴 수 있습니다.' }, { status: 403 })

    const form = await req.formData()
    const file = form.get('file')
    const scope = String(form.get('scope') ?? '')
    const isPrivate = form.get('private') === 'true'

    if (!SCOPES.includes(scope)) return NextResponse.json({ error: '잘못된 업로드 위치입니다.' }, { status: 400 })
    if (isPrivate && scope !== 'people') return NextResponse.json({ error: '비공개 업로드는 섬기는 분들만 가능합니다.' }, { status: 400 })
    if (!(file instanceof File) || !file.type.startsWith('image/')) {
        return NextResponse.json({ error: '이미지 파일을 선택해 주세요.' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) return NextResponse.json({ error: '이미지는 15MB 이하만 올릴 수 있습니다.' }, { status: 400 })

    let webp: Buffer
    try {
        webp = await sharp(Buffer.from(await file.arrayBuffer()))
            .rotate()
            .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer()
    } catch {
        return NextResponse.json({ error: '이미지를 읽을 수 없습니다.' }, { status: 400 })
    }

    const bucket = isPrivate ? 'board-private' : 'board-images'
    const path = `${scope}/${crypto.randomUUID()}.webp`
    const storage = getServiceClient().storage.from(bucket)
    const { error } = await storage.upload(path, webp, { contentType: 'image/webp' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const url = isPrivate ? `/api/board-images/${path}` : storage.getPublicUrl(path).data.publicUrl
    return NextResponse.json({ url })
}
