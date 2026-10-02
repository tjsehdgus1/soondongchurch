-- ============================================================
-- 2026-10-02 사이트 설정 관리자 — 게시판 관리·페이지 문구·연혁·섬기는 분들·선교지는
-- 관리자 중에서도 can_manage_site = true 인 사람만 (선동현, 노성소)
-- 선행: 20261001_signup_approval.sql / 여러 번 실행해도 안전 (idempotent)
-- ============================================================

alter table public.profiles add column if not exists can_manage_site boolean not null default false;

-- profiles 쓰기 정책이 없고 회원 관리 API도 이 값을 받지 않음 → 바꾸려면 이 SQL처럼 직접 실행
update public.profiles set can_manage_site = true where username in ('tjsehdgus1', 'shtjdth12');
