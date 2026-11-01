# 운영자 역할 + 부서·게시판 연동 — 구현 계획

설계: `doc/specs/2026-11-01-editor-role-board-groups-design.md`

## Task 1. DB (`supabase/20261101_editor_board_groups.sql`)
- `is_editor()` 함수, `board_groups` 표(RLS 켜고 정책 없음), `boards.group_id` 연결 옮기기
- `can_write_board` 교체 (운영자 허용, `board_groups`로 부서 판별) → 그다음 `boards.group_id` 삭제
- 초기 연결: 청년부 → 청년회(`young-adults`)
- 여러 번 실행해도 안전하게 (`if not exists`, `on conflict do nothing`)
- 검증: 롤백 트랜잭션으로 운영자·부서원·일반 회원별 권한 확인

## Task 2. 역할 이름 (`src/lib/roles.ts` + `tests/roles.test.ts`)
- `ROLES = ['member', 'editor', 'admin']`, `ROLE_LABEL`, `isRole()`
- 테스트 먼저: 세 역할 라벨, 잘못된 값 거부

## Task 3. 회원 관리 (`src/app/api/admin/members/route.ts`, `src/app/admin/members/page.tsx`)
- API: `isRole`로 검증, 본인 강등 방지 조건을 `role !== 'admin'`으로
- 화면: 권한 배지 3색(관리자 보라·운영자 파랑·일반 초록), 선택지 3개 + 운영자 설명

## Task 4. 부서 관리 (`src/app/api/admin/groups/route.ts`, `src/app/admin/groups/page.tsx`)
- GET: 부서별 연결 게시판 id + 글쓰기 '부서' 게시판 목록
- PATCH `?id=`: `board_ids` 배열로 연결 통째로 바꾸기 (CSRF 검사, 글쓰기 '부서' 게시판만 허용)
- 화면: 카드에 연결 게시판 표시, '게시판 연결' 창(체크박스, 메뉴별 묶음)

## Task 5. 게시판 관리 (`src/app/api/admin/boards/route.ts`, `src/app/admin/(site)/boards/page.tsx`, `src/lib/boards.ts`)
- `group_id` 입력·타입 삭제, GET에 게시판별 연결 부서 이름
- 화면: 부서 선택 칸 → '연결된 부서' 표시, 권한 이름 바꿈

## Task 6. 문서·검증
- CLAUDE.md 역할·권한·DB 적용 순서, design.md 해당 줄
- lint·test·build, 로컬 미리보기로 세 화면 확인
