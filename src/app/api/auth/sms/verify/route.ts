import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/admin'
import { checkCsrf } from '@/lib/csrf'

export async function POST(req: NextRequest) {
    // CSRF 검증
    if (!checkCsrf(req)) {
        return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 403 })
    }

    const { phone, code } = await req.json()

    if (!phone || !code) {
        return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const now = new Date().toISOString()

    // 유효한 인증 레코드 조회 (코드 비교 전에 레코드 먼저 가져옴)
    const { data: verification } = await supabase
        .from('sms_verifications')
        .select('*')
        .eq('phone', phone)
        .eq('verified', false)
        .gt('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (!verification) {
        return NextResponse.json({ error: '인증번호가 만료되었습니다. 다시 요청해주세요.' }, { status: 400 })
    }

    // 브루트포스 방지: 5회 이상 실패 시 코드 즉시 무효화
    const failedAttempts = verification.failed_attempts ?? 0
    if (failedAttempts >= 5) {
        await supabase
            .from('sms_verifications')
            .update({ expires_at: now })
            .eq('id', verification.id)
        return NextResponse.json(
            { error: '인증 시도 횟수를 초과했습니다. 인증번호를 다시 요청해주세요.' },
            { status: 429 }
        )
    }

    // 코드 불일치
    if (verification.code !== String(code)) {
        await supabase
            .from('sms_verifications')
            .update({ failed_attempts: failedAttempts + 1 })
            .eq('id', verification.id)
        return NextResponse.json({ error: '인증번호가 일치하지 않습니다.' }, { status: 400 })
    }

    // 인증 성공
    await supabase
        .from('sms_verifications')
        .update({ verified: true })
        .eq('id', verification.id)

    return NextResponse.json({ success: true })
}
