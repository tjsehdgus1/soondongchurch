-- ============================================================
-- 2026-10-01 보안 수정 — Supabase 대시보드 SQL Editor에서 1회 실행
-- 여러 번 실행해도 안전 (idempotent)
-- ============================================================

-- ---- 1. 관리자 판별 함수 (profiles 정책의 자기참조 재귀 방지) ----
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and not is_blocked);
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;


-- ---- 2. profiles: 본인/관리자만 조회, 클라이언트 수정 불가 ----
-- 기존 정책 전부 제거 (대시보드에서 추가된 정책 포함)
do $$ declare r record; begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'profiles' loop
    execute format('drop policy %I on public.profiles', r.policyname);
  end loop;
end $$;

alter table public.profiles enable row level security;

-- 전화번호·이메일 보호: 본인 행 또는 관리자만 조회
create policy "프로필 조회" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

-- UPDATE/INSERT/DELETE 정책 없음 → role·is_blocked 자가 변경 차단
-- (프로필 수정은 관리자 API가 service role로만 수행, 생성은 handle_new_user 트리거)


-- ---- 3. sms_verifications: 인증번호 외부 조회 차단 ----
do $$ declare r record; begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'sms_verifications' loop
    execute format('drop policy %I on public.sms_verifications', r.policyname);
  end loop;
end $$;

-- 정책 없음 + RLS 활성화 → service role(서버 API)만 접근
alter table public.sms_verifications enable row level security;


-- ---- 4. 게시글/댓글 작성자 위조 방지 ----
-- 로그인 사용자 요청이면 author_id·author_name을 서버에서 강제 설정
create or replace function public.set_post_author()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    -- 차단된 회원은 글·댓글 작성 불가
    if exists (select 1 from public.profiles where id = auth.uid() and is_blocked) then
      raise exception '차단된 사용자입니다.';
    end if;
    new.author_id := auth.uid();
    new.author_name := coalesce((select name from public.profiles where id = auth.uid()), '');
  end if;
  return new;
end;
$$;

-- 수정 시 작성자·소속 그룹 변경 금지 (다른 그룹으로 글 이동 차단)
create or replace function public.lock_post_author()
returns trigger language plpgsql as $$
begin
  new.author_id := old.author_id;
  new.author_name := old.author_name;
  new.group_id := old.group_id;
  return new;
end;
$$;

drop trigger if exists group_posts_set_author on public.group_posts;
create trigger group_posts_set_author
  before insert on public.group_posts
  for each row execute procedure public.set_post_author();

drop trigger if exists group_posts_lock_author on public.group_posts;
create trigger group_posts_lock_author
  before update on public.group_posts
  for each row execute procedure public.lock_post_author();

drop trigger if exists group_post_comments_set_author on public.group_post_comments;
create trigger group_post_comments_set_author
  before insert on public.group_post_comments
  for each row execute procedure public.set_post_author();


-- ---- 5. group-images: 본인 폴더에만 업로드 ----
drop policy if exists "소그룹 이미지 업로드" on storage.objects;
create policy "소그룹 이미지 업로드" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'group-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );


-- ---- 6. (선택) 설교 기능 삭제에 따른 테이블 정리 ----
-- 설교 데이터가 더 필요 없을 때만 주석 해제 후 실행 (복구 불가)
-- drop table if exists public.sermons;
