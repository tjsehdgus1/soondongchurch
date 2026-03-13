-- ============================================================
-- 교회 홈페이지 Supabase DB Schema
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- ---- profiles (사용자 프로필) --------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null,
  role        text not null default 'member', -- 'admin' | 'member'
  created_at  timestamptz not null default now()
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
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email
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


-- ---- 샘플 데이터 (선택) -------------------------------------
insert into public.events (title, event_type, event_date, event_time, location, description) values
  ('주일 예배',      'worship', current_date + 3, '11:00', '본당',       '매주 일요일 오전 11시 주일 예배'),
  ('수요 예배',      'worship', current_date + 5, '19:30', '본당',       '매주 수요일 저녁 7시 30분 수요 예배'),
  ('새벽 기도회',   'worship', current_date + 1, '05:30', '기도실',     '매일 새벽 5시 30분 기도회'),
  ('구역 예배',      'meeting', current_date + 7, '19:00', '각 구역장 자택', '매주 금요일 구역 예배'),
  ('청년부 수련회', 'event',   current_date + 14, '09:00', '수련원',    '청년부 봄 수련회 (1박 2일)');

insert into public.notices (title, content, author_name, is_pinned) values
  ('2026년 봄 행사 안내', '봄을 맞이하여 다양한 교회 행사가 준비되어 있습니다. 많은 참여 바랍니다.', '관리자', true),
  ('헌신 예배 안내', '다음 주일은 특별 헌신 예배로 진행됩니다. 전 교인 참석 바랍니다.', '관리자', false),
  ('성경 공부 모집', '매주 화요일 저녁 8시 성경 공부 스터디를 모집합니다. 관심 있는 분은 사무실로 연락주세요.', '관리자', false);
