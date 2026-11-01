-- ============================================================
-- 2026-11-01 운영자 역할 + 부서·게시판 여러 개 연결
-- - 운영자(profiles.role = 'editor'): 모든 게시판에 글쓰기, 수정·삭제는 자기 글만, 관리자 화면 없음
-- - board_groups: 한 부서가 여러 게시판, 한 게시판에 여러 부서 (boards.group_id 대체)
-- 선행: 20261002_site_managers.sql / 여러 번 실행해도 안전 (idempotent)
-- ============================================================

-- ---- 1. 운영자 판별 (승인됐고 차단되지 않은 운영자) ----
create or replace function public.is_editor()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'editor' and not is_blocked and is_approved);
$$;
revoke all on function public.is_editor() from public;
grant execute on function public.is_editor() to anon, authenticated;


-- ---- 2. 부서 ↔ 게시판 연결 ----
-- RLS만 켜고 정책 없음 → 관리자 API(서비스 키)와 보안 정의 함수(can_write_board)만 접근
create table if not exists public.board_groups (
  board_id bigint not null references public.boards(id) on delete cascade,
  group_id bigint not null references public.groups(id) on delete cascade,
  primary key (board_id, group_id)
);
create index if not exists idx_board_groups_group on public.board_groups (group_id);
alter table public.board_groups enable row level security;

-- 기존 게시판당 부서 하나 연결 옮기기 (컬럼이 남아 있을 때만)
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'boards' and column_name = 'group_id') then
    insert into public.board_groups (board_id, group_id)
    select id, group_id from public.boards where group_id is not null
    on conflict do nothing;
  end if;
end $$;


-- ---- 3. 글쓰기 권한: 운영자 허용 + board_groups로 부서 판별 ----
create or replace function public.can_write_board(bid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select case b.write_level
      when 'admin'  then public.is_admin() or public.is_editor()
      when 'group'  then public.is_admin() or public.is_editor() or (
        public.is_active_member() and exists (
          select 1 from public.board_groups bg
          join public.group_members gm on gm.group_id = bg.group_id
          where bg.board_id = b.id and gm.user_id = auth.uid()
        ))
      when 'member' then public.is_active_member()
    end
    from public.boards b where b.id = bid
  ), false);
$$;
revoke all on function public.can_write_board(bigint) from public;
grant execute on function public.can_write_board(bigint) to anon, authenticated;

-- 함수가 더 이상 쓰지 않으므로 옛 컬럼 삭제
alter table public.boards drop column if exists group_id;


-- ---- 4. 초기 연결: 청년부 → 청년회 게시판 (사용자 요청) ----
insert into public.board_groups (board_id, group_id)
select b.id, g.id from public.boards b, public.groups g
where b.slug = 'young-adults' and g.name = '청년부'
on conflict do nothing;
