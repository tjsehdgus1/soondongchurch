-- ============================================================
-- 2026-10-01 게시판 (네이버 카페 이관) — Supabase 대시보드 SQL Editor에서 실행
-- 선행: schema.sql, 20261001_security_fix.sql (is_admin, set_post_author, set_updated_at 사용)
-- 여러 번 실행해도 안전 (idempotent)
-- ============================================================

-- ---- 1. 게시판 ------------------------------------------------
create table if not exists public.boards (
  id           bigserial primary key,
  slug         text not null unique,
  name         text not null,
  section      text not null,                 -- 상단 메뉴 그룹 ('말씀', '전도회' ...)
  kind         text not null default 'list' check (kind in ('list', 'card')),
  write_level  text not null default 'admin' check (write_level in ('admin', 'group', 'member')),
  group_id     bigint references public.groups(id) on delete set null,  -- write_level = 'group'일 때 글쓰기 부서
  categories   text[] not null default '{}',  -- 말머리
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.boards enable row level security;

drop policy if exists "게시판 조회" on public.boards;
create policy "게시판 조회" on public.boards for select using (true);
-- 게시판 생성·수정·삭제는 관리자 API(service role) 전용 → 쓰기 정책 없음


-- ---- 2. 게시글 ------------------------------------------------
create table if not exists public.board_posts (
  id               bigserial primary key,
  board_id         bigint not null references public.boards(id) on delete cascade,
  author_id        uuid references public.profiles(id) on delete set null,
  author_name      text not null default '',
  category         text,                      -- 말머리
  title            text not null,
  content          text not null default '',  -- HTML (렌더 시 DOMPurify 정화)
  youtube_id       text,                      -- 유튜브 영상 (모든 게시판 선택 입력)
  thumbnail_url    text,                      -- 카드 목록용 대표 이미지
  is_pinned        boolean not null default false,
  members_only     boolean not null default false,  -- true면 로그인 회원만 열람
  cafe_article_id  bigint unique,             -- 네이버 카페 원본 글 번호 (이관 중복 방지)
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_board_posts_list
  on public.board_posts (board_id, is_pinned desc, created_at desc);

alter table public.board_posts enable row level security;

-- 로그인 상태이고 차단되지 않은 회원
create or replace function public.is_active_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and not is_blocked);
$$;
revoke all on function public.is_active_member() from public;
grant execute on function public.is_active_member() to anon, authenticated;

-- 게시판 글쓰기 권한
create or replace function public.can_write_board(bid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select case b.write_level
      when 'admin'  then public.is_admin()
      when 'group'  then public.is_admin() or (
        public.is_active_member() and exists (
          select 1 from public.group_members gm
          where gm.group_id = b.group_id and gm.user_id = auth.uid()
        ))
      when 'member' then public.is_active_member()
    end
    from public.boards b where b.id = bid
  ), false);
$$;
revoke all on function public.can_write_board(bigint) from public;
grant execute on function public.can_write_board(bigint) to anon, authenticated;

drop policy if exists "게시글 조회" on public.board_posts;
create policy "게시글 조회" on public.board_posts for select using (
  not members_only or public.is_active_member()
);

-- 고정글·회원전용 지정은 관리자만
drop policy if exists "게시글 작성" on public.board_posts;
create policy "게시글 작성" on public.board_posts for insert with check (
  public.can_write_board(board_id)
  and ((not is_pinned and not members_only) or public.is_admin())
);

drop policy if exists "게시글 수정" on public.board_posts;
create policy "게시글 수정" on public.board_posts for update
  using (author_id = auth.uid() or public.is_admin())
  with check ((not is_pinned and not members_only) or public.is_admin());

drop policy if exists "게시글 삭제" on public.board_posts;
create policy "게시글 삭제" on public.board_posts for delete using (
  author_id = auth.uid() or public.is_admin()
);

-- 작성자 강제 설정 (20261001_security_fix.sql 의 set_post_author 재사용)
drop trigger if exists board_posts_set_author on public.board_posts;
create trigger board_posts_set_author
  before insert on public.board_posts
  for each row execute procedure public.set_post_author();

-- 수정 시 작성자·게시판 고정
create or replace function public.lock_board_post_author()
returns trigger language plpgsql as $$
begin
  new.author_id := old.author_id;
  new.author_name := old.author_name;
  new.board_id := old.board_id;
  new.cafe_article_id := old.cafe_article_id;
  return new;
end;
$$;

drop trigger if exists board_posts_lock_author on public.board_posts;
create trigger board_posts_lock_author
  before update on public.board_posts
  for each row execute procedure public.lock_board_post_author();

drop trigger if exists board_posts_updated_at on public.board_posts;
create trigger board_posts_updated_at
  before update on public.board_posts
  for each row execute procedure public.set_updated_at();


-- ---- 3. Storage ----------------------------------------------
-- board-images: 공개 이미지 / board-private: 회원 전용 글 이미지 (서버가 서명 URL로 전달)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('board-images',  'board-images',  true,  10485760, array['image/jpeg','image/png','image/webp','image/gif']),
  ('board-private', 'board-private', false, 10485760, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

drop policy if exists "게시판 이미지 업로드" on storage.objects;
create policy "게시판 이미지 업로드" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'board-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "게시판 이미지 삭제" on storage.objects;
create policy "게시판 이미지 삭제" on storage.objects
  for delete to authenticated using (
    bucket_id = 'board-images'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );
-- board-private 는 정책 없음 → service role 전용


-- ---- 4. 게시판 초기 데이터 (카페 메뉴 매핑) --------------------
insert into public.boards (slug, name, section, kind, write_level, categories, sort_order) values
  ('about',             '교회 소개',        '교회소개', 'list', 'admin',  '{}', 10),

  ('sermon-senior',     '담임목사 설교',    '말씀',     'card', 'admin',  '{}', 20),
  ('sermon-associate',  '협동목사 설교',    '말씀',     'card', 'admin',  '{}', 21),
  ('sermon-guest',      '외부강사',         '말씀',     'card', 'admin',  '{}', 22),
  ('sermon-festival',   '전도축제',         '말씀',     'card', 'admin',  '{}', 23),
  ('missionary-sermon', '선교사 설교',      '말씀',     'card', 'admin',  '{}', 24),

  ('baekhap',           '백합전도회',       '전도회',   'card', 'group',  '{}', 30),
  ('men-1',             '제1남전도회',      '전도회',   'card', 'group',  '{}', 31),
  ('men-2',             '제2남전도회',      '전도회',   'card', 'group',  '{}', 32),
  ('men-3',             '제3남전도회',      '전도회',   'card', 'group',  '{}', 33),
  ('women-1',           '제1여전도회',      '전도회',   'card', 'group',  '{}', 34),
  ('women-2',           '제2여전도회',      '전도회',   'card', 'group',  '{}', 35),
  ('women-3',           '제3여전도회',      '전도회',   'card', 'group',  '{}', 36),

  ('kids',              '유아 유치반',      '교회학교', 'card', 'group',  '{}', 40),
  ('sunday-school',     '주일학교',         '교회학교', 'card', 'group',  '{}', 41),
  ('youth',             '학생회',           '교회학교', 'card', 'group',  '{}', 42),
  ('young-adults',      '청년회',           '교회학교', 'card', 'group',  '{}', 43),

  ('mission-trip',      '단기선교',         '선교·교육', 'card', 'group', '{}', 50),
  ('mission-news',      '선교소식',         '선교·교육', 'list', 'group', '{}', 51),
  ('newcomers',         '새가족반',         '선교·교육', 'list', 'group', '{}', 52),
  ('discipleship',      '제자대학',         '선교·교육', 'card', 'group', '{}', 53),

  ('praise-coramdeo',   '코람데오 찬양단',  '찬양',     'card', 'group',  '{}', 60),
  ('praise-neul',       '늘 찬양 찬양단',   '찬양',     'card', 'group',  '{}', 61),
  ('praise-special',    '특송',             '찬양',     'card', 'admin',  '{}', 62),

  ('free',              '자유게시판',       '커뮤니티', 'list', 'member', '{}', 70),
  ('testimony',         '간증',             '커뮤니티', 'list', 'member', '{제자대학 간증,단기선교 간증,기타 간증}', 71),
  ('events-gallery',    '교회 행사',        '커뮤니티', 'card', 'admin',  '{}', 72)
on conflict (slug) do nothing;
