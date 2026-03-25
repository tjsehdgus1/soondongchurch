import { NextRequest, NextResponse } from 'next/server'
import { SolapiMessageService } from 'solapi'
import { getServiceClient } from '@/lib/admin'

export async function POST(req: NextRequest) {
    const { phone } = await req.json()

    if (!phone || phone.length < 10) {
        return NextResponse.json({ error: '올바른 휴대폰 번호를 입력해 주세요.' }, { status: 400 })
    }

    const code = String(Math.floor(100000 + Math.random() * 900000))

    const supabase = getServiceClient()

    // 기존 미인증 코드 삭제 (같은 번호로 재발송 시)
    await supabase
        .from('sms_verifications')
        .delete()
        .eq('phone', phone)
        .eq('verified', false)

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
