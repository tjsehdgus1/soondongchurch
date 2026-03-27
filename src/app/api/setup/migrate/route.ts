import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/admin'

const PROJECT_REF = process.env.NEXT_PUBLIC_SUPABASE_URL!
    .replace('https://', '')
    .split('.')[0]

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

    // 1. profiles 누락 컬럼 추가
    await runSQL(`
        ALTER TABLE public.profiles
          ADD COLUMN IF NOT EXISTS name         text NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS phone_number text NOT NULL DEFAULT '',
          ADD COLUMN IF NOT EXISTS is_blocked   boolean NOT NULL DEFAULT false;
    `)
    results.push('profiles 컬럼 보강 완료')

    // 2. handle_new_user 트리거 함수 재생성 (name, phone_number 포함)
    await runSQL(`
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
        BEGIN
          INSERT INTO public.profiles (id, username, name, email, phone_number)
          VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
            COALESCE(NEW.raw_user_meta_data->>'name', ''),
            COALESCE(NEW.raw_user_meta_data->>'real_email', ''),
            COALESCE(NEW.raw_user_meta_data->>'phone_number', '')
          )
          ON CONFLICT (id) DO UPDATE SET
            name         = COALESCE(EXCLUDED.name, profiles.name),
            phone_number = COALESCE(EXCLUDED.phone_number, profiles.phone_number);
          RETURN NEW;
        END;
        $$;
    `)
    await runSQL(`
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    `)
    results.push('handle_new_user 트리거 완료')

    // 3. sms_verifications 테이블
    await runSQL(`
        CREATE TABLE IF NOT EXISTS public.sms_verifications (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            phone VARCHAR(20) NOT NULL,
            code VARCHAR(6) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes'),
            verified BOOLEAN DEFAULT FALSE
        );
    `)
    results.push('sms_verifications 테이블 완료')

    // 4. bulletins 테이블
    await runSQL(`
        CREATE TABLE IF NOT EXISTS public.bulletins (
            id           bigserial PRIMARY KEY,
            title        text NOT NULL,
            bulletin_date date NOT NULL,
            file_url     text NOT NULL,
            file_path    text NOT NULL DEFAULT '',
            created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `)
    await runSQL(`ALTER TABLE public.bulletins ENABLE ROW LEVEL SECURITY;`)
    await runSQL(`
        DO $$ BEGIN
          CREATE POLICY "주보 조회" ON public.bulletins FOR SELECT USING (true);
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)
    await runSQL(`
        DO $$ BEGIN
          CREATE POLICY "주보 작성" ON public.bulletins FOR INSERT WITH CHECK (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
          );
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)
    await runSQL(`
        DO $$ BEGIN
          CREATE POLICY "주보 삭제" ON public.bulletins FOR DELETE USING (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
          );
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)
    results.push('bulletins 테이블 완료')

    // 5. groups 테이블
    await runSQL(`
        CREATE TABLE IF NOT EXISTS public.groups (
          id          bigserial PRIMARY KEY,
          name        text NOT NULL,
          description text NOT NULL DEFAULT '',
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `)
    await runSQL(`ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;`)
    await runSQL(`
        DO $$ BEGIN
          CREATE POLICY "소그룹 조회" ON public.groups FOR SELECT USING (auth.uid() IS NOT NULL);
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)
    await runSQL(`
        DO $$ BEGIN
          CREATE POLICY "소그룹 작성" ON public.groups FOR INSERT WITH CHECK (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
          );
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)
    await runSQL(`
        DO $$ BEGIN
          CREATE POLICY "소그룹 수정" ON public.groups FOR UPDATE USING (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
          );
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)
    await runSQL(`
        DO $$ BEGIN
          CREATE POLICY "소그룹 삭제" ON public.groups FOR DELETE USING (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
          );
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)
    results.push('groups 테이블 완료')

    // 6. group_members 테이블
    await runSQL(`
        CREATE TABLE IF NOT EXISTS public.group_members (
          id        bigserial PRIMARY KEY,
          group_id  bigint NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
          user_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
          joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(group_id, user_id)
        );
    `)
    await runSQL(`ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;`)
    await runSQL(`
        DO $$ BEGIN
          DROP POLICY IF EXISTS "소그룹멤버 조회" ON public.group_members;
          CREATE POLICY "소그룹멤버 조회" ON public.group_members FOR SELECT USING (
            user_id = auth.uid()
            OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
          );
        END $$;
    `)
    await runSQL(`
        DO $$ BEGIN
          CREATE POLICY "소그룹멤버 추가" ON public.group_members FOR INSERT WITH CHECK (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
          );
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)
    await runSQL(`
        DO $$ BEGIN
          CREATE POLICY "소그룹멤버 삭제" ON public.group_members FOR DELETE USING (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
          );
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)
    results.push('group_members 테이블 완료')

    // 7. group_posts 테이블
    await runSQL(`
        CREATE TABLE IF NOT EXISTS public.group_posts (
          id          bigserial PRIMARY KEY,
          group_id    bigint NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
          author_id   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
          author_name text NOT NULL DEFAULT '',
          title       text NOT NULL,
          content     text NOT NULL,
          image_url   text,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `)
    await runSQL(`ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;`)
    await runSQL(`
        DO $$ BEGIN
          CREATE POLICY "소그룹 게시글 조회" ON public.group_posts FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_posts.group_id AND user_id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
          );
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)
    await runSQL(`
        DO $$ BEGIN
          CREATE POLICY "소그룹 게시글 작성" ON public.group_posts FOR INSERT WITH CHECK (
            EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_posts.group_id AND user_id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
          );
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)
    await runSQL(`
        DO $$ BEGIN
          CREATE POLICY "소그룹 게시글 수정" ON public.group_posts FOR UPDATE USING (
            author_id = auth.uid()
            OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
          );
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)
    await runSQL(`
        DO $$ BEGIN
          CREATE POLICY "소그룹 게시글 삭제" ON public.group_posts FOR DELETE USING (
            author_id = auth.uid()
            OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
          );
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)
    results.push('group_posts 테이블 완료')

    // 8. sermons 테이블에 tags 컬럼 추가
    await runSQL(`
        ALTER TABLE public.sermons
          ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
    `)
    results.push('sermons tags 컬럼 추가 완료')

    // 9. tags 필터링용 GIN 인덱스 생성
    await runSQL(`
        CREATE INDEX IF NOT EXISTS idx_sermons_tags ON public.sermons USING GIN (tags);
    `)
    results.push('sermons tags GIN 인덱스 생성 완료')

    // 10. Storage 버킷 생성
    const supabase = getServiceClient()

    const { error: bulletinBucketErr } = await supabase.storage.createBucket('bulletins', {
        public: true,
        fileSizeLimit: 20971520, // 20MB
        allowedMimeTypes: ['application/pdf'],
    })
    if (bulletinBucketErr && !bulletinBucketErr.message.includes('already exists')) {
        return NextResponse.json({ error: bulletinBucketErr.message, results }, { status: 500 })
    }
    results.push('bulletins 스토리지 버킷 완료')

    const { error: groupImageBucketErr } = await supabase.storage.createBucket('group-images', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
    })
    if (groupImageBucketErr && !groupImageBucketErr.message.includes('already exists')) {
        return NextResponse.json({ error: groupImageBucketErr.message, results }, { status: 500 })
    }
    results.push('group-images 스토리지 버킷 완료')

    return NextResponse.json({ success: true, results })
}
