-- ============================================================
-- 2026-10-01 홈페이지 리디자인 — Supabase 대시보드 SQL Editor에서 실행
-- 선행: 20261001_security_fix.sql, 20261001_boards.sql (is_active_member 사용)
-- 여러 번 실행해도 안전 (idempotent)
-- 쓰기 정책 없음 → 수정은 관리자 API(service role) 전용
-- ============================================================

-- ---- 1. 게시판 → 허브(탭) 배정 --------------------------------
alter table public.boards add column if not exists hub text;
alter table public.boards add column if not exists tab_order int not null default 0;

update public.boards b set hub = v.hub, tab_order = v.tab_order
from (values
  ('sermon-senior', 'sermons', 1), ('sermon-associate', 'sermons', 2), ('sermon-guest', 'sermons', 3),
  ('sermon-festival', 'sermons', 4), ('missionary-sermon', 'sermons', 5),
  ('praise-coramdeo', 'praise', 1), ('praise-neul', 'praise', 2), ('praise-special', 'praise', 3),
  ('kids', 'next-gen', 1), ('sunday-school', 'next-gen', 2), ('youth', 'next-gen', 3), ('young-adults', 'next-gen', 4),
  ('mission-trip', 'mission', 1), ('mission-news', 'mission', 2),
  ('baekhap', 'fellowship', 1), ('men-1', 'fellowship', 2), ('men-2', 'fellowship', 3), ('men-3', 'fellowship', 4),
  ('women-1', 'fellowship', 5), ('women-2', 'fellowship', 6), ('women-3', 'fellowship', 7),
  ('discipleship', 'discipleship', 1), ('newcomers', 'discipleship', 2),
  ('events-gallery', 'community', 1), ('testimony', 'community', 2), ('free', 'community', 3)
) as v(slug, hub, tab_order)
where b.slug = v.slug and b.hub is null;
-- 'about'(교회 소개)은 콘텐츠 테이블로 이전 → hub null(메뉴·전체글에서 숨김)

-- 탭 이름 정리 (허브 안에서 짧게)
update public.boards set name = '담임목사' where slug = 'sermon-senior' and name = '담임목사 설교';
update public.boards set name = '협동목사' where slug = 'sermon-associate' and name = '협동목사 설교';
update public.boards set name = '초청설교' where slug = 'sermon-guest' and name = '외부강사';
update public.boards set name = '선교사' where slug = 'missionary-sermon' and name = '선교사 설교';


-- ---- 2. 페이지 문구·사진 블록 ---------------------------------
create table if not exists public.page_blocks (
  key        text primary key,           -- 'about.greeting', 'worship.intro' ...
  title      text,
  subtitle   text,
  body       text,                       -- 짧은 HTML (렌더 시 DOMPurify 정화)
  image_url  text,
  updated_at timestamptz not null default now()
);
alter table public.page_blocks enable row level security;
drop policy if exists "페이지 블록 조회" on public.page_blocks;
create policy "페이지 블록 조회" on public.page_blocks for select using (true);

drop trigger if exists page_blocks_updated_at on public.page_blocks;
create trigger page_blocks_updated_at
  before update on public.page_blocks
  for each row execute procedure public.set_updated_at();


-- ---- 3. 연혁 -------------------------------------------------
create table if not exists public.timeline_items (
  id          bigserial primary key,
  year        int not null,
  date_label  text,                      -- '7. 15'
  title       text not null,
  description text,
  image_url   text,
  sort_order  int not null default 0
);
alter table public.timeline_items enable row level security;
drop policy if exists "연혁 조회" on public.timeline_items;
create policy "연혁 조회" on public.timeline_items for select using (true);


-- ---- 4. 섬기는 분들 --------------------------------------------
create table if not exists public.people (
  id           bigserial primary key,
  category     text not null,            -- '역대 담임교역자' '담임목사' '시무장로' ...
  name         text not null,
  role         text,
  period       text,
  photo_url    text,
  members_only boolean not null default false,  -- 교인 사진: 로그인 회원만
  sort_order   int not null default 0
);
alter table public.people enable row level security;
drop policy if exists "섬기는 분들 조회" on public.people;
create policy "섬기는 분들 조회" on public.people for select using (
  not members_only or public.is_active_member()
);


-- ---- 5. 선교지 -----------------------------------------------
create table if not exists public.mission_fields (
  id           bigserial primary key,
  country      text not null,
  region       text,
  lat          double precision not null check (lat between -90 and 90),
  lng          double precision not null check (lng between -180 and 180),
  missionaries text,
  summary      text,
  image_url    text,
  board_slug   text,                     -- 관련 글 게시판
  category     text,                     -- 관련 글 말머리 (선택)
  sort_order   int not null default 0
);
alter table public.mission_fields enable row level security;
drop policy if exists "선교지 조회" on public.mission_fields;
create policy "선교지 조회" on public.mission_fields for select using (true);
