import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
}

export async function POST(req: NextRequest) {
    const { phone, code } = await req.json()

    if (!phone || !code) {
        return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
    }

    const supabase = getServiceClient()

    const { data, error } = await supabase
        .from('sms_verifications')
        .select('*')
        .eq('phone', phone)
        .eq('code', code)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (error || !data) {
        return NextResponse.json({ error: '인증번호가 일치하지 않거나 만료되었습니다.' }, { status: 400 })
    }

    await supabase
        .from('sms_verifications')
        .update({ verified: true })
        .eq('id', data.id)

    return NextResponse.json({ success: true })
}
