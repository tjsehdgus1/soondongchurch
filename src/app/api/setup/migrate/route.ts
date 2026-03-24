import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const PROJECT_REF = process.env.NEXT_PUBLIC_SUPABASE_URL!
    .replace('https://', '')
    .split('.')[0]

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
}

async function runSQL(query: string) {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
    })
    if (!res.ok) throw new Error(await res.text())
}

export async function POST(req: NextRequest) {
    const { secret } = await req.json()

    if (secret !== process.env.MIGRATE_SECRET) {
        return NextResponse.json({ error: '인증 실패' }, { status: 401 })
    }

    const results: string[] = []

    // 1. sms_verifications 테이블
    await runSQL(`
        CREATE TABLE IF NOT EXISTS sms_verifications (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            phone VARCHAR(20) NOT NULL,
            code VARCHAR(6) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes'),
            verified BOOLEAN DEFAULT FALSE
        );
    `)
    results.push('sms_verifications 테이블 완료')

    // 2. bulletins 테이블
    await runSQL(`
        CREATE TABLE IF NOT EXISTS bulletins (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            bulletin_date DATE NOT NULL,
            file_url TEXT NOT NULL,
            file_path TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `)
    results.push('bulletins 테이블 완료')

    // 3. bulletins Storage 버킷 생성
    const supabase = getServiceClient()
    const { error: bucketError } = await supabase.storage.createBucket('bulletins', {
        public: true,
        fileSizeLimit: 20971520, // 20MB
        allowedMimeTypes: ['application/pdf'],
    })
    if (bucketError && !bucketError.message.includes('already exists')) {
        return NextResponse.json({ error: bucketError.message, results }, { status: 500 })
    }
    results.push('bulletins 스토리지 버킷 완료')

    return NextResponse.json({ success: true, results })
}
