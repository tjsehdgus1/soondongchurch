-- ============================================================
-- 교회 홈페이지 Supabase DB Schema
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- ---- profiles (사용자 프로필) --------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text not null,
  email        text not null,
  phone_number text default '', -- 추가된 휴대폰 번호 컬럼
  role         text not null default 'member', -- 'admin' | 'member'
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 자신의 프로필은 누구나 조회 가능
create policy "프로필 조회" on public.profiles
  for select using (true);

-- 자신의 프로필만 수정 가능
create policy "프로필 수정" on public.profiles
  for update using (auth.uid() = id);

-- 회원가입 시 자동으로 profiles 행 생성
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, phone_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone_number', '')  -- 회원가입 시 핸드폰 번호 저장
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ---- notices (공지사항) -------------------------------------
create table if not exists public.notices (
  id          bigserial primary key,
  title       text not null,
  content     text not null,
  author_id   uuid references public.profiles(id) on delete set null,
  author_name text not null default '',
  is_pinned   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.notices enable row level security;

-- 누구나 조회 가능
create policy "공지사항 조회" on public.notices
  for select using (true);

-- 로그인한 admin만 작성/수정/삭제
create policy "공지사항 작성" on public.notices
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "공지사항 수정" on public.notices
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "공지사항 삭제" on public.notices
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notices_updated_at on public.notices;
create trigger notices_updated_at
  before update on public.notices
  for each row execute procedure public.set_updated_at();


-- ---- events (예배/행사 일정) ---------------------------------
create table if not exists public.events (
  id          bigserial primary key,
  title       text not null,
  event_type  text not null default 'worship', -- 'worship' | 'event' | 'meeting'
  event_date  date not null,
  event_time  time,
  location    text not null default '',
  description text not null default '',
  created_at  timestamptz not null default now()
);

alter table public.events enable row level security;

-- 누구나 조회 가능
create policy "일정 조회" on public.events
  for select using (true);

-- admin만 작성/수정/삭제
create policy "일정 작성" on public.events
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "일정 수정" on public.events
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "일정 삭제" on public.events
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- ---- sermons (설교 요약 게시판) ---------------------------------
create table if not exists public.sermons (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  youtube_id  text not null unique,
  preacher    text not null default '김광선 목사',
  sermon_date date not null default current_date,
  summary     text,
  raw_transcript text,
  thumbnail_url text,
  status      text not null default 'draft', -- 'draft' | 'published'
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.sermons enable row level security;

-- 누구나 조회 가능 (공개된 설교만)
create policy "공개된 설교 조회" on public.sermons
  for select using (status = 'published');

-- 관리자는 모든 설교 조회/작성/수정/삭제 가능
create policy "관리자 모든 권한" on public.sermons
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- updated_at 자동 갱신 트리거
drop trigger if exists sermons_updated_at on public.sermons;
create trigger sermons_updated_at
  before update on public.sermons
  for each row execute procedure public.set_updated_at();

-- (샘플 데이터 제외됨: 불필요한 공지사항 및 행사 이벤트 데이터 삭제 완료)
