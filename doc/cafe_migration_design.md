# 네이버 카페 → 홈페이지 이관 설계

> **구현 현황 (2026-10-01)**: 1~3·5단계 코드 완료 — `supabase/20261001_boards.sql`, `/board/*`, Navbar 드롭다운, `/admin/boards`, `scripts/cafe-import.mjs`.
> 구현 중 변경: kind는 `list`/`card` 2종(영상·사진 모두 card), `/about` 대신 `/board/about`, 영상은 본문 iframe을 지우고 `youtube_id`로 상세 상단에 표시, 글 71은 회원 전용(`members_only` + 비공개 버킷).

- 대상: 네이버 카페 `cafe.naver.com/scsdc` (cafeId 31793387, 전체글 79건)
- 목표: **카페를 폐쇄하고 홈페이지 단독 운영** — 카페의 메뉴와 게시물을 그대로 옮긴다
- 결정 사항 (2026-10-01)
  - 설교영상·선교사 설교 → **영상 게시판**으로 이관 (AI 요약 없음, 유튜브 영상 + 제목·날짜·본문)
  - 부서 게시판 → **혼합 권한**: 열람은 누구나, 글쓰기는 해당 부서 멤버 + 관리자
  - 이관 범위 → **본문 + 이미지 + 작성일** (댓글 제외, 작성자는 원 닉네임을 텍스트로만 표시)

---

## 1. 메뉴 매핑

`kind`: list(일반 목록) / gallery(사진 카드) / video(유튜브 카드)
`쓰기`: admin(관리자만) / group(해당 부서 멤버+관리자) / member(로그인 회원)

| 카페 그룹 | 카페 메뉴 (menuId) | 홈페이지 위치 | slug | kind | 쓰기 |
|---|---|---|---|---|---|
| — | 전체글보기 (0) | `/board` 전체 최신글 | — | — | — |
| — | 교회 소개 (46) | `/about` 교회 소개 | `about` | list | admin |
| — | 자유게시판 (1) | 커뮤니티 › 자유게시판 | `free` | list | member |
| — | 백합전도회 (12) | 전도회 › 백합전도회 | `baekhap` | list | group |
| 남전도회 | 제1·2·3 남전도회 (2·3·4) | 전도회 › 제N 남전도회 | `men-1` `men-2` `men-3` | list | group |
| 여전도회 | 제1·2·3 여전도회 (5·6·7) | 전도회 › 제N 여전도회 | `women-1` `women-2` `women-3` | list | group |
| 교회학교 | 유아 유치반 (8) | 교회학교 › 유아 유치반 | `kids` | gallery | group |
| 교회학교 | 주일학교 (9) | 교회학교 › 주일학교 | `sunday-school` | gallery | group |
| 교회학교 | 학생회 (10) | 교회학교 › 학생회 | `youth` | gallery | group |
| 교회학교 | 청년회 (11) | 교회학교 › 청년회 | `young-adults` | gallery | group |
| 순동GTM선교 | 단기선교 (15) | 선교 › 단기선교 | `mission-trip` | gallery | group |
| 순동GTM선교 | 선교소식 (16) | 선교 › 선교소식 | `mission-news` | list | group |
| 순동GTM선교 | 선교사 설교 (30) | 말씀 › 선교사 설교 | `missionary-sermon` | video | admin |
| 교육 | 새가족반 (28) | 교육 › 새가족반 | `newcomers` | list | group |
| 교육 | 제자대학 (13) | 교육 › 제자대학 | `discipleship` | list | group |
| 설교영상 | 담임목사 (24) | 말씀 › 담임목사 설교 | `sermon-senior` | video | admin |
| 설교영상 | 협동목사 (26) | 말씀 › 협동목사 설교 | `sermon-associate` | video | admin |
| 설교영상 | 외부강사 (25) | 말씀 › 외부강사 | `sermon-guest` | video | admin |
| 설교영상 | 전도축제 (29) | 말씀 › 전도축제 | `sermon-festival` | video | admin |
| 찬양 | 코람데오 찬양단 (38) | 찬양 › 코람데오 찬양단 | `praise-coramdeo` | video | group |
| 찬양 | 늘 찬양 찬양단 (39) | 찬양 › 늘 찬양 찬양단 | `praise-neul` | video | group |
| 찬양 | 특송 (40) | 찬양 › 특송 | `praise-special` | video | admin |
| 간증 | 제자대학·단기선교·기타 간증 (32·33·34) | 커뮤니티 › 간증 (말머리로 구분) | `testimony` | list | member |
| — | 기타행사 (41) | 커뮤니티 › 행사 사진 | `gallery` | gallery | admin |

메모
- 간증 3개 메뉴는 글 수가 적을 것으로 보여 **게시판 1개 + 말머리(category) 3개**로 합친다. 글이 많으면 3개로 분리.
- `group` 권한 게시판은 기존 `groups` 테이블의 부서와 연결한다 (부서별 그룹이 없으면 이관 시 생성).
- 기존 `소그룹`(회원 전용 비공개 게시판)은 그대로 유지한다. 부서 게시판은 **공개 열람**이라 별도 기능이다.

## 2. 상단 메뉴(IA)

```
교회소개   교회 소개 · 오시는길
말씀       담임목사 · 협동목사 · 외부강사 · 전도축제 · 선교사 설교
예배·소식  주간예배일정(주보) · 행사일정 · 공지사항
전도회     백합 · 남전도회 1~3 · 여전도회 1~3
교회학교   유아 유치반 · 주일학교 · 학생회 · 청년회
선교·교육  단기선교 · 선교소식 · 새가족반 · 제자대학
찬양       코람데오 · 늘 찬양 · 특송
커뮤니티   자유게시판 · 간증 · 행사 사진 · (로그인 시) 소그룹
```

현재 Navbar는 단층 5개 메뉴라 **드롭다운(데스크톱) + 아코디언(모바일)** 형태로 바꾼다. 메뉴는 `boards` 테이블에서 읽어 구성한다(관리자가 게시판 추가·순서 변경 가능).

## 3. DB 설계

```sql
-- 게시판
create table public.boards (
  id           bigserial primary key,
  slug         text not null unique,
  name         text not null,
  section      text not null,            -- 상단 메뉴 그룹: '말씀' '전도회' ...
  kind         text not null default 'list' check (kind in ('list','gallery','video')),
  write_level  text not null default 'admin' check (write_level in ('admin','group','member')),
  group_id     bigint references public.groups(id) on delete set null,  -- write_level='group'일 때
  categories   text[] not null default '{}',  -- 말머리 (간증 등)
  sort_order   int not null default 0,
  cafe_menu_id int unique,               -- 이관 매핑용
  created_at   timestamptz not null default now()
);

-- 게시글
create table public.board_posts (
  id                bigserial primary key,
  board_id          bigint not null references public.boards(id) on delete cascade,
  author_id         uuid references public.profiles(id) on delete set null,
  author_name       text not null default '',
  category          text,                -- 말머리
  title             text not null,
  content           text not null default '',   -- HTML (DOMPurify 정화 후 렌더)
  youtube_id        text,                -- video 게시판
  thumbnail_url     text,                -- 목록 카드용 (첫 이미지 또는 유튜브 썸네일)
  is_pinned         boolean not null default false,
  cafe_article_id   bigint unique,       -- 이관 원본 글 번호 (재실행 시 중복 방지)
  created_at        timestamptz not null default now(),  -- 이관 글은 카페 작성일 유지
  updated_at        timestamptz not null default now()
);
create index on public.board_posts (board_id, is_pinned desc, created_at desc);
```

RLS
- `boards`, `board_posts` SELECT: 누구나 (`using (true)`)
- `board_posts` INSERT: `write_level`에 따라 — admin: `is_admin()` / group: 해당 `group_members` 또는 `is_admin()` / member: `auth.uid() is not null`
- UPDATE/DELETE: 작성자 본인 또는 `is_admin()`
- 작성자 위조 방지: 기존 `set_post_author()` / `lock_post_author()` 트리거 재사용 (`lock`에서 `group_id` 대신 `board_id` 고정)
- `boards` 쓰기: 관리자 API(service role) 전용

Storage
- `board-images` 버킷 (public, 10MB, 이미지 MIME만) — 업로드는 본인 폴더(`{uid}/...`), 이관 이미지는 `cafe/{articleId}/...`

## 4. 화면

| 경로 | 내용 |
|---|---|
| `/board` | 전체 최신글 (카페 "전체글보기" 대체) |
| `/board/[slug]` | 게시판 목록 — kind별 레이아웃(목록/사진 카드/영상 카드), 말머리 필터, 페이지네이션 |
| `/board/[slug]/[id]` | 상세 — 본문(정화된 HTML), video면 유튜브 임베드, 이전/다음 글 |
| `/board/[slug]/new`, `/edit` | 작성·수정 — 기존 `TiptapEditor` 재사용, video 게시판은 유튜브 URL 입력칸 |
| `/about` | `about` 게시판 고정글을 교회 소개 페이지로 렌더 |
| `/admin/boards` | 게시판 관리 (추가·순서·권한·연결 부서) |

홈 화면: 삭제한 설교 섹션 자리에 **"최근 말씀 영상"**(말씀 섹션 video 게시판 최신 2건)을 다시 노출할지는 구현 시 확인.

## 5. 이관 절차

### 5-1. 내보내기 — 완료 (2026-10-01)
`scsdc-cafe-export/` (gitignore 처리, 커밋 금지 — 355MB·교인 사진 포함)

| 항목 | 수량 | 검증 결과 |
|---|---|---|
| 게시판 | 29 (글 있는 곳 21) | `boards.json` 글 수 = 실제 글 수 일치 |
| 게시물 | 79 | 작성일 2026-09-19 ~ 09-29 |
| 이미지 | 268장 / 352MB | 참조 누락 0, 고아 파일 0, 최대 8MB(4032px), 5MB 초과 15장 |
| 유튜브 | 62개 (고유 60) | 글당 0~1개, 전부 `youtube.com/embed` iframe |
| 댓글 | 2 | 글 17 — 이관 범위 제외 |
| 본문 HTML | `p` `figure` `img` `iframe` `table` 만 사용 | script·style 속성 없음 |

데이터 특이사항
- **글 1** "카페를 시작합니다" — 네이버 자동 생성 환영글, 정제 본문이 비어 있음 → **이관 제외**
- **글 71** "2026년 교회 제직 및 사진" — 표 안에 교인 사진 94장 → 공개 범위 확인 필요 (7절)
- **글 75** "역대 담임 교역자" — 표 구조, 이미지 없음
- 영상은 영상 게시판 외에도 자유게시판·주일학교·단기선교·간증·기타행사 글 18개에 있음 → `youtube_id`는 모든 게시판에서 선택 입력
- 중복 영상 2개(자유게시판 글 7·8 ↔ 특송 글 35·41) — 원본대로 둘 다 이관

### 5-2. 가져오기 (로컬 Node 스크립트) `scripts/cafe-import.ts`
- 입력: `posts.json`의 `bodyHtml` + `images/`
- 이미지: **긴 변 1920px로 줄이고 JPEG 품질 85로 변환** 후 `board-images/cafe/{articleId}/` 업로드 (352MB → 약 60MB 예상, 무료 플랜 1GB 여유) → 본문 `src="images/..."` 를 Storage 공개 URL로 치환
- 영상: `videos[0].youtubeId` → `youtube_id`, 목록 썸네일 = 첫 이미지 또는 `img.youtube.com/vi/{id}/hqdefault.jpg`
- `createdAt` 그대로 유지, `author_name` = `writer`, `author_id` = null (service role 삽입이라 작성자 트리거 영향 없음)
- 간증 3개 게시판(32·33·34) → `testimony` 게시판 + `category` 말머리
- `cafe_article_id` 기준 upsert → 재실행해도 중복 없음
- 렌더링: 본문에 유튜브 iframe이 있어 **DOMPurify 기본 설정은 iframe을 지움** → `ADD_TAGS: ['iframe']` + `src`가 `https://www.youtube.com/embed/`로 시작하는 것만 남기는 훅 적용

### 5-3. 검수 · 전환
- 게시판별 글 수 대조 (21개 게시판, 78건 = 79 − 환영글 1)
- 이미지 깨짐·영상 재생·표(글 71·75) 레이아웃·모바일 확인
- 카페 공지로 홈페이지 주소 안내 → 병행 기간 → 카페 폐쇄

## 6. 구현 순서

| 단계 | 작업 | 산출물 |
|---|---|---|
| 1 | DB·RLS·버킷 SQL | `supabase/2026XXXX_boards.sql` (대시보드 실행) |
| 2 | 게시판 화면 (목록·상세·작성·수정, 3가지 kind) | `/board/*` |
| 3 | Navbar 드롭다운 IA + `/about` + 관리자 게시판 관리 | |
| 4 | ~~내보내기~~ 완료 | `scsdc-cafe-export/` |
| 5 | 가져오기 스크립트 → 이관 → 검수 | `scripts/cafe-import.ts` |
| 6 | CLAUDE.md 갱신 (영상 게시판은 AI 없는 일반 게시판으로 허용됨 명시) | |

## 7. 확인 필요

- **글 71 교인 사진 94장**: 누구나 보는 공개로 둘지, 로그인 회원만 보게 할지 (개인정보)

- 부서별 글쓰기 담당자: 각 전도회·교회학교·찬양단의 멤버(그룹) 구성을 누가 관리할지 — 기본은 관리자가 `/admin/groups`에서 지정
- 홈 화면에 최근 말씀 영상 노출 여부
- 카페 회원을 홈페이지 회원으로 안내하는 방법 (자동 이전 불가 — 홈페이지에서 새로 가입)
