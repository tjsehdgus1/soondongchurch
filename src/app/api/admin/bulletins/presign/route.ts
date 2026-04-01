import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, verifyAdmin } from '@/lib/admin'
import { checkCsrf } from '@/lib/csrf'

export async function POST(req: NextRequest) {
    try {
        if (!checkCsrf(req)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 403 })

        const admin = await verifyAdmin()
        if (!admin) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

        const { filePath } = await req.json()
        if (!filePath) return NextResponse.json({ error: 'filePath가 없습니다.' }, { status: 400 })

        // 경로 트래버설 방지
        if (filePath.includes('..') || filePath.includes('/')) {
            return NextResponse.json({ error: '잘못된 경로입니다.' }, { status: 400 })
        }

        // PDF 확장자만 허용
        if (!filePath.toLowerCase().endsWith('.pdf')) {
            return NextResponse.json({ error: 'PDF 파일만 업로드 가능합니다.' }, { status: 400 })
        }

        // 파일명 특수문자 방지 (알파벳, 숫자, 하이픈, 언더스코어, 점만 허용)
        if (!/^[\w\-. ]+$/.test(filePath)) {
            return NextResponse.json({ error: '잘못된 파일명입니다.' }, { status: 400 })
        }

        const supabase = getServiceClient()
        const { data, error } = await supabase.storage
            .from('bulletins')
            .createSignedUploadUrl(filePath)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ signedUrl: data.signedUrl, token: data.token, path: data.path })
    } catch (err) {
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
    }
}
