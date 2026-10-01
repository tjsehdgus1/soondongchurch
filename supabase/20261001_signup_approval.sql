-- ============================================================
-- 2026-10-01 회원가입 승인제 — 관리자가 승인해야 로그인·회원 기능 사용 (네이버 카페 가입 승인처럼)
-- 선행: 20261001_security_fix.sql, 20261001_boards.sql
-- 여러 번 실행해도 안전 (idempotent)
-- ============================================================

-- ---- 1. 승인 여부 컬럼 (기존 회원은 승인된 것으로) ----
alter table public.profiles add column if not exists is_approved boolean;
update public.profiles set is_approved = true where is_approved is null;
alter table public.profiles alter column is_approved set default false;
alter table public.profiles alter column is_approved set not null;
-- 새 가입자는 handle_new_user 트리거가 기본값(false)으로 생성 → 관리자 승인 대기
-- profiles 쓰기 정책이 없으므로 본인이 승인 값을 바꿀 수 없음 (관리자 API만)


-- ---- 2. 회원 판별: 차단되지 않고 승인된 회원 ----
create or replace function public.is_active_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and not is_blocked and is_approved);
$$;
revoke all on function public.is_active_member() from public;
grant execute on function public.is_active_member() to anon, authenticated;


-- ---- 3. 글·댓글 작성자 설정: 차단·미승인 회원은 작성 불가 ----
create or replace function public.set_post_author()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    if exists (select 1 from public.profiles where id = auth.uid() and (is_blocked or not is_approved)) then
      raise exception '차단되었거나 가입 승인 전인 사용자입니다.';
    end if;
    new.author_id := auth.uid();
    new.author_name := coalesce((select name from public.profiles where id = auth.uid()), '');
  end if;
  return new;
end;
$$;
