# 순천순동교회 홈페이지 리디자인 설계

- 작성: 2026-10-01
- 선행: 카페 이관 완료 (`doc/cafe_migration_design.md`), 게시판 27개·글 78건 운영 DB 반영
- 목표: 메뉴 정리 + 콘텐츠 페이지 전환 + "비싸게 만든" 시네마틱 인터랙션 + 3D 2곳

## 확정된 결정

| 항목 | 결정 |
|---|---|
| 메뉴 | 5개: 교회소개 / 예배·말씀 / 다음세대 / 선교·사역 / 소식·나눔 |
| 디자인 톤 | 시네마틱 에디토리얼 — 기존 Warm Editorial(크림·골드·차콜, Noto Serif KR + Pretendard) 유지하며 격 상승 |
| 3D | 선교 3D 지구본(`/mission`), 홈 히어로 빛 셰이더 — 그 외 3D 없음 |
| 콘텐츠 수정 | 관리자가 관리자 화면에서 직접 수정 (디자인 고정, 문구·사진·항목만) |
| 히어로 | 사진 + 시네마 효과 (Ken Burns 확대·교차 전환 + 빛 셰이더). 영상은 추후 교체 가능 구조 |
| 기술 | GSAP 3 (ScrollTrigger·SplitText) + Lenis, 지구본 `react-globe.gl`, 히어로 `ogl` |

## 1. 정보 구조

| 메뉴 | 화면 | 경로 | 형태 | 데이터 |
|---|---|---|---|---|
| 교회소개 | 환영합니다 | `/about` | 콘텐츠 | `page_blocks` (about.*) |
| | 걸어온 길 | `/about/history` | 콘텐츠 (가로 스크롤 연혁) | `timeline_items` |
| | 섬기는 분들 | `/about/people` | 콘텐츠 | `people` (제직 사진 `members_only`) |
| | 오시는길 | `/directions` | 기존 개선 | 기존 |
| 예배·말씀 | 예배 안내 | `/worship` | 콘텐츠 | `page_blocks` (worship.*) + 예배 시간표 |
| | 말씀 | `/sermons` | 영상 허브 | hub `sermons` |
| | 찬양 | `/praise` | 영상 허브 | hub `praise` |
| | 주보 | `/bulletins` | 기존 | 기존 |
| 다음세대 | 다음세대 | `/next-gen` | 소개 + 부서 탭 | `page_blocks` (nextgen.*) + hub `next-gen` |
| 선교·사역 | 선교 | `/mission` | 3D 지구본 + 탭 | `mission_fields` + hub `mission` |
| | 전도회 | `/fellowship` | 소개 + 탭 | `page_blocks` (fellowship.*) + hub `fellowship` |
| | 양육 | `/discipleship` | 소개 + 탭 | `page_blocks` (discipleship.*) + hub `discipleship` |
| 소식·나눔 | 공지사항 | `/notices` | 기존 | 기존 |
| | 행사일정 | `/events` | 기존 | 기존 |
| | 교회 행사 | `/board/events-gallery` | 게시판(카드) | hub `community` |
| | 간증 | `/board/testimony` | 게시판 | hub `community` |
| | 자유게시판 | `/board/free` | 게시판 | hub `community` |

로그인 시 소식·나눔에 "소그룹", 관리자에게 "관리자" 링크 추가 (현행 유지).

### 허브 ↔ 게시판 배정 (`boards.hub`, `boards.tab_order`)

| hub | 탭 (slug) |
|---|---|
| `sermons` | 담임목사 `sermon-senior` · 협동목사 `sermon-associate` · 초청설교 `sermon-guest` · 전도축제 `sermon-festival` · 선교사 `missionary-sermon` |
| `praise` | 코람데오 `praise-coramdeo` · 늘 찬양 `praise-neul` · 특송 `praise-special` |
| `next-gen` | 유아 유치반 `kids` · 주일학교 `sunday-school` · 학생회 `youth` · 청년회 `young-adults` |
| `mission` | 단기선교 `mission-trip` · 선교소식 `mission-news` |
| `fellowship` | 백합 `baekhap` · 남1~3 `men-1..3` · 여1~3 `women-1..3` |
| `discipleship` | 제자대학 `discipleship` · 새가족반 `newcomers` |
| `community` | 교회 행사 `events-gallery` · 간증 `testimony` · 자유게시판 `free` |
| `null` (숨김) | 교회 소개 `about` — 콘텐츠 테이블로 이전 후 메뉴·전체글에서 제외 |

- 허브 화면 탭 상태는 `?tab=slug` (공유 가능한 주소), 기본은 `tab_order` 첫 게시판
- 글 상세·작성·수정은 기존 `/board/[slug]/[id]` 그대로. 상세의 "목록" 링크는 소속 허브 탭으로
- 글 0건 탭: "준비 중입니다" 빈 상태 + (권한 있으면) 글쓰기 버튼
- 새 게시판을 관리자 화면에서 추가할 때 hub·탭 순서 지정 가능
- `boards.section`·`SECTION_ORDER`는 hub로 대체되어 제거

### 리다이렉트 (`next.config.ts` redirects, 영구)
- `/board/about` → `/about`, `/board/about/:id` → `/about`
- `/board/{허브 소속 slug}` → `/{hub 경로}?tab={slug}` (상세 `/board/{slug}/{id}`는 유지)

## 2. 데이터 모델 (`supabase/20261001_redesign.sql`)

모든 테이블: RLS 활성, SELECT `using (true)` (단 `people`은 아래), 쓰기 정책 없음 → 관리자 API(service role) 전용.

```sql
alter table boards add column hub text, add column tab_order int not null default 0;

page_blocks (
  key text primary key,          -- 'about.greeting', 'about.vision', 'worship.intro', 'nextgen.intro' ...
  title text, subtitle text,
  body text,                     -- 짧은 HTML (DOMPurify 정화 렌더)
  image_url text,
  updated_at timestamptz default now()
)

timeline_items (
  id bigserial pk, year int not null, date_label text,   -- '7. 15'
  title text not null, description text, image_url text,
  sort_order int not null default 0
)

people (
  id bigserial pk,
  category text not null,        -- '역대 담임목사' '교역자' '장로' '권사' '안수집사' ...
  name text not null, role text, period text,            -- '1946~1960'
  photo_url text, members_only boolean not null default false,
  sort_order int not null default 0
)
-- SELECT: not members_only or is_active_member()

mission_fields (
  id bigserial pk, country text not null, region text,
  lat double precision not null, lng double precision not null,
  missionaries text, summary text, image_url text,
  board_slug text, category text,  -- 연결 글 (선교소식/단기선교 등)
  sort_order int not null default 0
)
```

이미지: 공개 사진은 `board-images/pages/...`, 회원 전용(제직)은 `board-private/people/...` + `/api/board-images/...` (기존 방식).

### 초기 데이터 이전 (`scripts/redesign-seed.mjs`, 재실행 안전)
- `page_blocks`: "순천순동교회 비전 표어 목표" 글 → about.vision, 현재 홈 히어로·예배 문구 → about.greeting / worship.intro, 다음세대·전도회·양육 소개는 기본 문구로 생성(관리자 수정)
- `timeline_items`: "교회연혁" 글의 `<p>YYYY. M. D 내용</p>` 줄을 연도·날짜·내용으로 분해. 분해 실패 줄은 직전 항목 description에 이어붙임
- `people`: "역대 담임 교역자" 표 → category '역대 담임목사' / 글 71 표(사진 94장) → 셀의 이름·직분·사진으로 분해, `members_only = true`, 사진은 이미 `board-private/cafe/71/`에 있으므로 경로 재사용
- `mission_fields`: 캄보디아 깜퐁츠낭(김영대·조정아, 단기선교 1~4차), 태국, 튀르키예, 탄자니아 잔지바르(오영금) — 좌표는 대표 도시
- 이전 후 원본 about 글 4건은 삭제하지 않음 (hub null로 숨김)

## 3. 공통 레이아웃·인터랙션

### 구성 요소
| 컴포넌트 | 역할 |
|---|---|
| `SmoothScroll` (client) | Lenis + GSAP ticker 연동, `prefers-reduced-motion`이면 비활성 |
| `SiteHeader` | 스크롤 내리면 숨김·올리면 표시, 히어로 위 투명 → 스크롤 시 반투명 크림. 데스크톱: 메뉴 hover/focus 시 5열 메가 패널. 모바일: 전체 화면 메뉴(항목 순차 등장) |
| `Reveal` | 섹션 진입 시 등장 (fade-up, 이미지 clip-path 마스크) — 기존 `ScrollReveal` 대체 |
| `SplitHeading` | 제목 줄 단위 등장 (GSAP SplitText) |
| `CountUp` | 숫자 카운트업 |
| `MagneticButton` | 데스크톱 포인터 추종 버튼 |
| `VideoModal` | 유튜브 모달 재생 (포커스 트랩, Esc 닫기, 닫으면 정지) |
| `HubTabs` | 허브 탭 (URL `?tab=` 동기화, 키보드 좌우 이동, 탭 전환 시 카드 stagger) |
| 페이지 전환 | Next 16 `experimental.viewTransition` + React `<ViewTransition>` 크로스페이드. 빌드·동작 확인이 안 되면 이 항목만 제외 (나머지 영향 없음) |

### 모션 원칙
- 지속시간 0.6~1.2s, 이징 `expo.out` 계열, 스크롤 연동은 scrub
- `prefers-reduced-motion: reduce` → 모든 등장 애니메이션 즉시 표시, Lenis·셰이더·지구본 자동회전 정지
- 터치 기기: 마그네틱·틸트 효과 없음
- GSAP 플러그인은 클라이언트 컴포넌트에서만 등록, 언마운트 시 `ctx.revert()`

## 4. 화면별

### 홈 `/`
1. 히어로: 사진 2~4장 Ken Burns 교차 전환 + `HeroLight` 셰이더 + 문구 줄 단위 등장 + 스크롤 유도
2. 이번 주 예배: 현재 KST 기준 다음 예배 강조, 5개 예배 가로 카드
3. 숫자: 창립 연도 기준 햇수, 선교지 수(`mission_fields` 개수), 다음세대 부서 수 — CountUp
4. 최근 말씀: hub `sermons` 최신 3건 (큰 카드 1 + 작은 카드 2), 클릭 시 VideoModal
5. 선교 티저: 지구본 정지 이미지 + 선교지 수 + "선교 이야기 보기"
6. 소식: 공지 3 / 다가오는 행사 3 / 갤러리 사진 띠(사진 있는 글 썸네일, 무한 가로 흐름)
7. 오시는 길 띠: 주소·예배시간·지도 버튼

### 걸어온 길 `/about/history`
- 데스크톱: 섹션 고정 + 스크롤에 따라 연혁 가로 이동(ScrollTrigger pin+scrub), 연도 대형 세리프, 진행 막대
- 모바일·reduced-motion: 세로 타임라인

### 섬기는 분들 `/about/people`
- 역대 담임목사: 세로 타임라인 (공개)
- 교역자·장로 등 직분별 사진 그리드, `members_only` 항목은 비로그인 시 그룹 단위로 "로그인하면 볼 수 있어요" 안내 (이름도 비노출)

### 말씀 `/sermons`, 찬양 `/praise`
- 상단 최신 영상 대형 플레이어 카드 → 아래 탭 + 카드 그리드, 카드 클릭 시 VideoModal (모달에 "글 보기" 링크)

### 선교 `/mission`
- `MissionGlobe` (dynamic import, `ssr: false`): 점(hex/dot) 지구본, 크림·차콜 톤, 순천(34.95, 127.49) → 각 선교지 금색 아크 반복, 핀 hover 시 선교사명, 클릭 시 사이드 패널(소개·사진·관련 글 링크)
- 스크롤 시 지구본 축소·상승, 하단 선교지 카드 + 단기선교·선교소식 탭
- 대체: WebGL 미지원 / reduced-motion / 저사양(`navigator.hardwareConcurrency <= 4` 그리고 모바일) → 정적 SVG 세계지도 + 핀 + 카드 (같은 데이터)

### 다음세대·전도회·양육
- `page_blocks` 소개(제목·본문·대표 사진) + 허브 탭

### 오시는길
- 기존 카카오맵 유지, 상단에 주소·교통·주차 안내 블록(`page_blocks` directions.*) 추가

## 5. 3D 상세

### HeroLight (`ogl`, 약 30KB)
- 전체 화면 플레인 1개, 프래그먼트 셰이더: 사선 빛줄기(노이즈 기반 god rays) + 빛 입자, 가산 혼합, 투명도 0.35 내외
- 마우스 위치로 광원 각도 ±5° 보간, IntersectionObserver로 화면 밖에서 렌더 중지, DPR 최대 1.5
- 대체: CSS radial/linear gradient 오버레이

### MissionGlobe (`react-globe.gl` + three, `/mission`에서만 로드)
- `hexPolygonsData`(국가 경계 GeoJSON, 저해상도 110m)로 점 지구본, 대기 광 크림색
- `arcsData`: 순천 → 각 선교지, `arcDashAnimateTime`으로 빛 이동, `pointsData`/`htmlElementsData`로 핀
- 자동 회전(reduced-motion 시 정지), 핀 클릭 시 해당 좌표로 카메라 이동
- GeoJSON은 `public/geo/countries-110m.json`으로 자체 호스팅

## 6. 관리자 화면

| 경로 | 기능 |
|---|---|
| `/admin/pages` | 페이지 블록 목록(페이지별 그룹) → 제목·부제·본문(간단 편집기)·이미지 업로드 |
| `/admin/history` | 연혁 표: 추가·수정·삭제·순서 |
| `/admin/people` | 섬기는 분들: 구분별 표, 사진 업로드(회원 전용 구분은 비공개 버킷), 순서 |
| `/admin/missions` | 선교지: 나라·지역·좌표·선교사·소개·사진·연결 게시판/말머리 |
| `/admin/boards` (기존) | hub·탭 순서 필드 추가, section 제거 |

API는 기존 패턴(`verifyAdmin` + `checkCsrf` + 필드 화이트리스트 + service role)을 따른다. 이미지 업로드는 서버 API가 sharp로 1920px webp 변환 후 저장.

## 7. 성능·접근성 기준

- 홈 초기 JS 증가분 ≤ 100KB(gzip), three.js는 `/mission`에서만
- Lighthouse 모바일: 성능 ≥ 80, 접근성 ≥ 95 (홈, `/sermons`, `/mission`)
- 히어로 이미지: `next/image` priority, AVIF/WebP
- 모든 인터랙션 키보드 가능, 포커스 표시 유지, 메가 메뉴 `aria-expanded`, 탭 `role=tablist`
- 색 대비 WCAG AA (골드 텍스트는 큰 글씨에만)

## 8. 검증

- 단계별 `tsc --noEmit` / `eslint` / `next build`
- 로컬 dev 서버 + 브라우저: 1440·375 폭, reduced-motion 에뮬레이션, WebGL 비활성 대체 화면, 비로그인 시 회원 전용 차단
- 시드 스크립트 `--dry-run`으로 분해 결과(연혁 항목 수, 제직 인원 수) 확인 후 실행

## 9. 구현 단계

| 단계 | 내용 | 확인 |
|---|---|---|
| 1 | 데이터: SQL, 시드 스크립트, 관리자 화면 4종, boards hub | 사용자 SQL 실행 → 시드 |
| 2 | 공통: 라이브러리 설치, SmoothScroll, SiteHeader(메가 메뉴), Reveal/SplitHeading/CountUp, 리다이렉트 | 화면 확인 |
| 3 | 홈 + HeroLight | 화면 확인 |
| 4 | 콘텐츠 페이지: about, history, people, worship, directions | 화면 확인 |
| 5 | 허브: sermons, praise, next-gen, fellowship, discipleship + VideoModal, HubTabs | 화면 확인 |
| 6 | 선교 + MissionGlobe + 대체 화면 | 화면 확인 |
| 7 | Lighthouse·접근성·모바일 점검, CLAUDE.md·design.md 갱신 | 최종 |

## 범위 밖

- 히어로 실제 영상 제작 (구조만 교체 가능하게)
- 3D 교회 건물, 다크 테마
- 다국어, 검색 기능
- 소그룹(회원 전용 게시판) 화면 개편 — 공통 헤더·스타일만 적용
