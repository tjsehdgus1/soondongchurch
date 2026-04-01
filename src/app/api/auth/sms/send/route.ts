import { NextRequest, NextResponse } from 'next/server'
import { SolapiMessageService } from 'solapi'
import { getServiceClient } from '@/lib/admin'
import { checkCsrf } from '@/lib/csrf'

export async function POST(req: NextRequest) {
    // CSRF 검증
    if (!checkCsrf(req)) {
        return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 403 })
    }

    const { phone } = await req.json()

    if (!phone || phone.length < 10) {
        return NextResponse.json({ error: '올바른 휴대폰 번호를 입력해 주세요.' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const now = new Date().toISOString()
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

    // Rate Limiting: 같은 번호로 2분 내 발송된 유효한 코드가 있으면 거부
    const { data: recentCode } = await supabase
        .from('sms_verifications')
        .select('created_at')
        .eq('phone', phone)
        .eq('verified', false)
        .gt('expires_at', now)
        .gt('created_at', twoMinutesAgo)
        .limit(1)
        .maybeSingle()

    if (recentCode) {
        return NextResponse.json(
            { error: '잠시 후 다시 시도해주세요. (2분에 1회 발송 가능)' },
            { status: 429 }
        )
    }

    // 기존 미인증 코드 무효화 (soft expire — expires_at을 현재 시각으로 설정)
    await supabase
        .from('sms_verifications')
        .update({ expires_at: now })
        .eq('phone', phone)
        .eq('verified', false)
        .gt('expires_at', now)

    const code = String(Math.floor(100000 + Math.random() * 900000))

    const { error: dbError } = await supabase
        .from('sms_verifications')
        .insert({ phone, code })

    if (dbError) {
        console.error('sms_verifications insert error:', dbError)
        return NextResponse.json({ error: '인증번호 저장에 실패했습니다.' }, { status: 500 })
    }

    try {
        const messageService = new SolapiMessageService(
            process.env.SOLAPI_API_KEY!,
            process.env.SOLAPI_API_SECRET!,
        )

        await messageService.sendOne({
            to: phone,
            from: process.env.SOLAPI_SENDER!,
            text: `[순천순동교회] 인증번호는 ${code}입니다. 5분 이내에 입력해 주세요.`,
        })
    } catch (smsError) {
        console.error('솔라피 SMS 발송 오류:', smsError)
        return NextResponse.json({ error: 'SMS 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
