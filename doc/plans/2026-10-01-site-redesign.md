# 홈페이지 리디자인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 메뉴 5개 정보구조, 관리자 수정 가능한 콘텐츠 페이지, 시네마틱 스크롤 인터랙션, 3D 2곳(히어로 빛·선교 지구본)으로 홈페이지를 개편한다.

**Architecture:** 기존 `boards`/`board_posts`는 유지하고 `boards.hub`로 허브 화면(탭)에 묶는다. 콘텐츠는 새 테이블 4개(`page_blocks`, `timeline_items`, `people`, `mission_fields`)에 두고 관리자 API(service role)로만 수정한다. 모션은 클라이언트 컴포넌트(GSAP+Lenis)로 격리하고, 3D는 dynamic import로 해당 화면에서만 로드한다.

**Tech Stack:** Next.js 16.1.6 (App Router), React 19.2, Supabase, Tailwind 4, GSAP 3.15 (ScrollTrigger, SplitText), Lenis 1.3, ogl 1.0, react-globe.gl 2.38, sharp(이미 설치), node:test

**Spec:** `doc/specs/2026-10-01-site-redesign-design.md`

## Global Constraints

- 메뉴 5개: 교회소개 / 예배·말씀 / 다음세대 / 선교·사역 / 소식·나눔
- 디자인 토큰: `src/app/globals.css`의 Warm Editorial 변수(--bg-base #FAF8F5, --accent #B8860B, --text-primary #2D2A26 등) 재사용, 폰트 Noto Serif KR(제목) + Pretendard(본문)
- `prefers-reduced-motion: reduce` → 등장 애니메이션 즉시 표시, Lenis·셰이더·지구본 자동회전 정지
- 터치 기기: 마그네틱·틸트 없음
- 홈 초기 JS 증가분 ≤ 100KB gzip, three.js는 `/mission`에서만
- Lighthouse 모바일 성능 ≥ 80, 접근성 ≥ 95 (홈, /sermons, /mission)
- 날짜는 KST 기준 (`Asia/Seoul`), `new Date('YYYY-MM-DD')` 금지
- 사용자 HTML은 DOMPurify 정화 후 렌더
- 관리자 API: `verifyAdmin()` + `checkCsrf()` + 필드 화이트리스트 + `getServiceClient()`
- DB 변경은 `supabase/*.sql` 파일 → 사용자가 대시보드 SQL Editor에서 실행 (Claude는 실행 불가)
- 커밋 메시지: 한글, `feat:`/`fix:`/`docs:` 접두, 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
- 검증: 단계마다 `npx tsc --noEmit`, `npx eslint`(오류 0), `npx next build`, `npm test`

---

## File Structure

```
supabase/20261001_redesign.sql          # 새 테이블 4개 + boards.hub/tab_order + RLS + 허브 배정
scripts/lib/parse-about.mjs             # 카페 글 HTML → 연혁/교역자/제직/블록 (순수 함수)
scripts/redesign-seed.mjs               # 파싱 결과를 DB에 upsert (--dry-run)
tests/parse-about.test.mjs              # 파서 테스트 (node:test)
tests/worship.test.ts                   # 다음 예배 계산 테스트
src/lib/hubs.ts                         # 허브 정의 (key, 경로, 이름, 메뉴 위치)
src/lib/site-menu.ts                    # 5개 메뉴 트리 (고정 링크 + 허브)
src/lib/worship.ts                      # 예배 시간표 + nextWorship(now)
src/lib/content.ts                      # page_blocks/timeline/people/missions 조회 함수
src/lib/motion.ts                       # GSAP 플러그인 등록, reduced-motion 판별
src/components/motion/SmoothScroll.tsx  # Lenis + ScrollTrigger 연동
src/components/motion/Reveal.tsx        # 등장 애니메이션
src/components/motion/SplitHeading.tsx  # 줄 단위 제목 등장
src/components/motion/CountUp.tsx
src/components/motion/MagneticButton.tsx
src/components/site/SiteHeader.tsx      # 숨김/표시 헤더 + 메가 메뉴 + 모바일 전체 메뉴 (Navbar 대체)
src/components/site/PageHero.tsx        # 하위 페이지 공통 상단
src/components/hub/HubPage.tsx          # 허브 화면 (소개 블록 + 탭 + 목록)
src/components/hub/HubTabs.tsx
src/components/video/VideoModal.tsx
src/components/video/VideoCard.tsx
src/components/home/*.tsx               # 홈 섹션 7개
src/components/three/HeroLight.tsx      # ogl 셰이더
src/components/three/MissionGlobe.tsx   # react-globe.gl
src/components/three/MissionMapFallback.tsx
src/app/(content pages)                 # about, about/history, about/people, worship, sermons, praise, next-gen, mission, fellowship, discipleship
src/app/admin/{pages,history,people,missions}/page.tsx
src/app/api/admin/{page-blocks,timeline,people,missions,upload}/route.ts
public/geo/countries-110m.json
```

---

## Phase 1 — 데이터와 관리자 화면

### Task 1: 리디자인 SQL

**Files:** Create `supabase/20261001_redesign.sql`

**Interfaces — Produces:** 테이블 `page_blocks(key pk, title, subtitle, body, image_url, updated_at)`, `timeline_items(id, year, date_label, title, description, image_url, sort_order)`, `people(id, category, name, role, period, photo_url, members_only, sort_order)`, `mission_fields(id, country, region, lat, lng, missionaries, summary, image_url, board_slug, category, sort_order)`, `boards.hub text`, `boards.tab_order int`.

- [ ] **Step 1:** SQL 작성 — 스펙 2절 스키마 그대로. 모든 테이블 RLS enable, SELECT 정책 `using (true)`, `people`만 `using (not members_only or public.is_active_member())`. 쓰기 정책 없음. `boards` 허브 배정 UPDATE (스펙 1절 표), `about`은 `hub = null`. `boards.section` 컬럼은 남겨두되 코드에서 미사용.
- [ ] **Step 2:** 문법 확인 — idempotent(`if not exists`, `drop policy if exists`) 검토
- [ ] **Step 3:** 사용자에게 실행 요청 (Phase 1 끝에 일괄)

### Task 2: 카페 글 파서 (TDD)

**Files:** Create `scripts/lib/parse-about.mjs`, `tests/parse-about.test.mjs`; Modify `package.json` (`"test": "node --test tests/"`)

**Interfaces — Produces:**
- `parseTimeline(html: string): Array<{ year: number, date_label: string|null, title: string, description: string|null, sort_order: number }>`
  - `<p>` 단위. `^\s*(\d{4})\s*\.\s*(.*)$` 이면 새 항목: 나머지 앞쪽의 `M. D`/`M.D.`/`M.D.~D` 날짜를 `date_label`로, 그 뒤를 `title`로. 연도로 시작하지 않는 줄은 직전 항목 `description`에 줄바꿈으로 이어붙임. 첫 항목 이전 줄(제목 '교 회 연 혁')은 버림. `&gt;` 등 엔티티 디코드.
- `parsePastor(html: string): Array<{ category: '역대 담임교역자', name, role, period, members_only: false, sort_order }>` — 두 번째 `<table>`의 데이터 행(헤더 '순번' 제외), 셀: 순번, 성명, 직함(공백 제거), 시무기간, 비고. 비고 있으면 period 뒤에 ` (비고)`.
- `parseStaff(html: string): Array<{ category, name, photo_src, members_only: true, sort_order }>` — 각 `<table>`: 1행 첫 셀=구분(공백 정규화: '시무 장로'→'시무장로'), 나머지 셀 img src, 2행 셀=이름(글자 사이 공백 제거). 사진 수와 이름 수가 다르면 짧은 쪽에 맞추고 경고 배열 반환하지 않고 throw.
- `normalizeName(s: string): string` — `'김 광 선'` → `'김광선'`

- [ ] **Step 1:** 테스트 작성

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseTimeline, parsePastor, parseStaff, normalizeName } from '../scripts/lib/parse-about.mjs'

test('normalizeName removes spaces between syllables', () => {
  assert.equal(normalizeName('김 광 선'), '김광선')
  assert.equal(normalizeName(' 장 대 직 '), '장대직')
})

test('parseTimeline splits year lines and joins continuation lines', () => {
  const html = '<p>교 회 연 혁</p><p>1946. 7. 15 해촌교회 설립</p><p>초대 당회장 보이열 목사(-&gt;1960.9.8.)</p><p>1959. 교단 분리</p><p>2026.1.12.~17 제 4 차 단기선교</p>'
  const items = parseTimeline(html)
  assert.equal(items.length, 3)
  assert.deepEqual(items[0], { year: 1946, date_label: '7. 15', title: '해촌교회 설립', description: '초대 당회장 보이열 목사(->1960.9.8.)', sort_order: 0 })
  assert.equal(items[1].date_label, null)
  assert.equal(items[1].title, '교단 분리')
  assert.equal(items[2].year, 2026)
  assert.equal(items[2].date_label, '1.12.~17')
  assert.equal(items[2].title, '제 4 차 단기선교')
})

test('parsePastor reads pastor table rows', () => {
  const html = '<table><tr><td>역대 담임교역자</td></tr></table><table><tr><td>순번</td><td>성 명</td><td>직 함</td><td>시 무 기 간</td><td>비고</td></tr><tr><td>1</td><td>손두환</td><td>전도사</td><td>1948. 8. 8 ~ 1949. 8.28</td><td>소천</td></tr><tr><td>16</td><td>김광선</td><td>목 사</td><td>2020. 7.26 ~ 현재</td><td></td></tr></table>'
  const rows = parsePastor(html)
  assert.equal(rows.length, 2)
  assert.deepEqual(rows[1], { category: '역대 담임교역자', name: '김광선', role: '목사', period: '2020. 7.26 ~ 현재', members_only: false, sort_order: 1 })
  assert.equal(rows[0].period, '1948. 8. 8 ~ 1949. 8.28 (소천)')
})

test('parseStaff pairs photos with names per table', () => {
  const html = '<table><tr><td>시무 장로</td><td><img src="a.webp"></td><td><img src="b.webp"></td></tr><tr><td>김 병 준</td><td>황 규 식</td></tr></table><table><tr><td>원로장로</td><td><img src="c.webp"></td></tr><tr><td>장 대 직</td></tr></table>'
  const rows = parseStaff(html)
  assert.deepEqual(rows.map((r) => [r.category, r.name, r.photo_src]), [
    ['시무장로', '김병준', 'a.webp'], ['시무장로', '황규식', 'b.webp'], ['원로장로', '장대직', 'c.webp'],
  ])
  assert.ok(rows.every((r) => r.members_only))
})
```

- [ ] **Step 2:** `npm test` → FAIL (모듈 없음)
- [ ] **Step 3:** `parse-about.mjs` 구현 (정규식 기반, 외부 의존성 없음)
- [ ] **Step 4:** `npm test` → PASS
- [ ] **Step 5:** 커밋 `feat: 카페 교회소개 글 파서`

### Task 3: 시드 스크립트

**Files:** Create `scripts/redesign-seed.mjs`

**Interfaces — Consumes:** Task 2 파서, DB `board_posts.cafe_article_id` 69(연혁)·70(비전)·71(제직)·75(역대 교역자)

- [ ] **Step 1:** 구현 — `node --env-file=.env.local scripts/redesign-seed.mjs [--dry-run]`
  - service role로 cafe_article_id 69/70/71/75 content 조회
  - timeline_items: 테이블 비어 있을 때만 insert (재실행 시 관리자 수정분 보존). people·page_blocks·mission_fields도 동일 원칙(비어 있을 때만)
  - people: parsePastor(75) + parseStaff(71) — 제직 사진 src(`/api/board-images/cafe/71/...webp`)를 그대로 photo_url로
  - page_blocks 기본값: `about.greeting`(제목 '하나님이 기뻐하시는 행복한 교회', 본문 인사말 기본 문구), `about.vision`(글 70 HTML), `worship.intro`, `nextgen.intro`, `fellowship.intro`, `discipleship.intro`, `mission.intro`, `directions.guide`, `home.hero`(title/subtitle)
  - mission_fields 4건: 캄보디아 깜퐁츠낭(11.99, 104.73, '김영대·조정아 선교사', board_slug 'mission-trip'), 태국 방콕(13.75, 100.50, board_slug 'mission-news'), 튀르키예 이스탄불(41.01, 28.98, 'mission-news'), 탄자니아 잔지바르(-6.16, 39.19, '오영금 선교사', 'mission-news')
  - --dry-run: 개수와 처음 3건 출력만
- [ ] **Step 2:** `--dry-run` 실행 (SQL 적용 전이면 테이블 없음 에러 → 파싱 결과만 출력하도록 dry-run은 DB 쓰기 없이 board_posts 읽기만)
- [ ] **Step 3:** 커밋 `feat: 리디자인 초기 데이터 시드 스크립트`

### Task 4: 콘텐츠 조회 함수와 허브 정의

**Files:** Create `src/lib/hubs.ts`, `src/lib/site-menu.ts`, `src/lib/content.ts`

**Interfaces — Produces:**
```ts
// hubs.ts
export type HubKey = 'sermons' | 'praise' | 'next-gen' | 'mission' | 'fellowship' | 'discipleship' | 'community'
export const HUBS: Record<HubKey, { path: string, title: string, eyebrow: string, introKey?: string, kind: 'video' | 'mixed' }>
// sermons → /sermons '말씀' / praise → /praise '찬양' / next-gen → /next-gen '다음세대' introKey 'nextgen.intro'
// mission → /mission '선교' introKey 'mission.intro' / fellowship → /fellowship '전도회' introKey 'fellowship.intro'
// discipleship → /discipleship '양육' introKey 'discipleship.intro' / community → '/board' '소식·나눔'
export function hubPathForBoard(board: { slug: string, hub: string | null }): string  // 허브 탭 주소 또는 /board/slug

// site-menu.ts
export type MenuItem = { href: string, label: string }
export type MenuSection = { label: string, items: MenuItem[] }
export function buildSiteMenu(opts: { loggedIn: boolean, isAdmin: boolean }): MenuSection[]  // 5개 고정 (스펙 1절)

// content.ts (서버 전용, createClient 사용)
export type PageBlock = { key: string, title: string | null, subtitle: string | null, body: string | null, image_url: string | null }
export async function getBlocks(prefix: string): Promise<Record<string, PageBlock>>
export async function getTimeline(): Promise<TimelineItem[]>
export async function getPeople(): Promise<{ items: Person[], hiddenCategories: string[] }>  // 비로그인 시 members_only 구분명만
export async function getMissionFields(): Promise<MissionField[]>
```
- [ ] **Step 1:** 구현. `getPeople`의 hiddenCategories는 RLS로 안 보이므로 SQL에 `people_categories` 뷰 대신 고정 목록 사용하지 않고, 서버에서 service client로 `select category where members_only` distinct 조회(이름 비노출)
- [ ] **Step 2:** `npx tsc --noEmit` 통과
- [ ] **Step 3:** 커밋

### Task 5: 관리자 API 4종 + 업로드

**Files:** Create `src/app/api/admin/page-blocks/route.ts`, `timeline/route.ts`, `people/route.ts`, `missions/route.ts`, `upload/route.ts`

- [ ] **Step 1:** 공통 패턴 (기존 `api/admin/boards/route.ts`와 동일 구조): GET 목록, POST 추가, PATCH `?id=`(page-blocks는 `?key=`) 수정, DELETE `?id=`. 필드 화이트리스트와 타입 검증(숫자·불리언·문자열 길이 ≤ 5000, 좌표 범위 −90~90/−180~180)
- [ ] **Step 2:** upload: multipart `file` + `scope`('pages'|'people'|'missions') + `private`(boolean, people만) → sharp 1920px webp q82 → `board-images/{scope}/{uuid}.webp` 또는 `board-private/people/{uuid}.webp` → `{ url }` (비공개는 `/api/board-images/...`). 이미지 MIME·10MB 검증
- [ ] **Step 3:** tsc/lint 통과, 커밋

### Task 6: 관리자 화면 4종 + 게시판 관리 hub 필드

**Files:** Create `src/app/admin/pages/page.tsx`, `history/page.tsx`, `people/page.tsx`, `missions/page.tsx`, `src/components/admin/ImageUploadField.tsx`; Modify `src/app/admin/boards/page.tsx`, `src/app/api/admin/boards/route.ts`, `src/app/admin/AdminSidebar.tsx`

- [ ] **Step 1:** `ImageUploadField({ value, onChange, scope, isPrivate? })` — 미리보기 + 업로드 + 제거
- [ ] **Step 2:** pages: key별 카드(그룹: 홈/교회소개/예배/다음세대/선교·사역/오시는길), 제목·부제·본문(textarea, 간단 HTML 허용 안내)·이미지
- [ ] **Step 3:** history/people/missions: 표 + 행별 편집·저장·삭제 + 추가 폼 + 순서 숫자. people은 구분 필터, members_only 체크(체크 시 사진 비공개 업로드)
- [ ] **Step 4:** boards: section → hub(select: HUBS 키 + '숨김') + tab_order. API 화이트리스트 갱신
- [ ] **Step 5:** 사이드바에 '페이지 문구', '연혁', '섬기는 분들', '선교지' 추가
- [ ] **Step 6:** tsc/lint/build, 커밋. 사용자에게 SQL 실행 → 시드 실행(Claude가 실행) → 관리자 화면 확인

---

## Phase 2 — 공통 레이아웃

### Task 7: 모션 기반

**Files:** `npm i gsap lenis`; Create `src/lib/motion.ts`, `src/components/motion/{SmoothScroll,Reveal,SplitHeading,CountUp,MagneticButton}.tsx`; Modify `src/app/layout.tsx`, `src/app/globals.css`

**Interfaces — Produces:**
- `prefersReducedMotion(): boolean`, `registerGsap(): typeof gsap` (ScrollTrigger·SplitText 1회 등록)
- `<Reveal as? delay? variant='up'|'mask' stagger?>` — 자식 등장, reduced-motion이면 즉시 표시. SSR 시 내용 보이도록 초기 숨김은 `html.js` 클래스가 있을 때만(CSS) → JS 미실행 시에도 콘텐츠 노출
- `<SplitHeading as='h1'|'h2' className>text</SplitHeading>` — 줄 단위 마스크 등장
- `<CountUp to suffix? duration?>`
- `<MagneticButton href className>` — `(pointer: fine)`에서만
- `<SmoothScroll>` — Lenis, `lenis.on('scroll', ScrollTrigger.update)`, gsap.ticker 연동, 라우트 변경 시 맨 위로
- [ ] 구현 → 기존 `ScrollReveal`·`useScrollAnimation` 사용처를 Reveal로 교체 후 삭제 → tsc/lint/build → 커밋

### Task 8: SiteHeader + 메가 메뉴 + 리다이렉트

**Files:** Create `src/components/site/SiteHeader.tsx`, `src/components/site/PageHero.tsx`; Delete `src/components/Navbar.tsx`; Modify `src/app/layout.tsx`, `next.config.ts`, `src/components/Footer.tsx`, `src/lib/boards.ts`(SECTION_ORDER 제거)

- [ ] 헤더: 스크롤 방향에 따라 숨김/표시, `data-hero` 영역 위에서는 투명+흰 글자. 데스크톱(≥1024) 메뉴 5개 → hover/focus 시 전체 폭 메가 패널(5열, `aria-expanded`), Esc 닫기. 모바일: 전체 화면 오버레이 메뉴(섹션별, 항목 stagger), body 스크롤 잠금
- [ ] `PageHero({ eyebrow, title, description?, image? })` — 하위 페이지 상단(이미지 있으면 시네마 배경)
- [ ] redirects: `/board/about(/:id)?` → `/about`; 허브 소속 slug 목록(`/board/sermon-senior` → `/sermons?tab=sermon-senior` …) — 상세 경로는 매칭 제외(`/board/:slug` 정확 매칭)
- [ ] 페이지 전환: `next.config.ts` `experimental.viewTransition: true` + `main`을 React `<ViewTransition>`으로 감싸 크로스페이드(CSS `::view-transition-old/new(root)` 0.35s). 빌드 실패·미동작 시 이 항목만 되돌림
- [ ] 푸터: 5개 메뉴 축약 + 주소·예배시간
- [ ] layout.tsx: boards 조회 제거(메뉴 고정), SmoothScroll 감싸기, `main`의 `pt-16` 제거(히어로가 헤더 아래로) → 하위 페이지는 PageHero가 상단 여백 처리
- [ ] 브라우저 확인(1440·375), tsc/lint/build, 커밋

---

## Phase 3 — 홈

### Task 9: 예배 계산 (TDD)

**Files:** Create `src/lib/worship.ts`, `tests/worship.test.ts`

**Interfaces — Produces:**
```ts
export type Worship = { key: string, name: string, dayLabel: string, days: number[], time: string /* 'HH:MM' */, image: string }
export const WORSHIPS: Worship[]  // 주일오전 0/11:00, 주일오후 0/13:30, 수요밤 3/19:00, 금요기도 5/20:00, 새벽 1-6/05:00
export function nextWorship(now: Date): { worship: Worship, startsAt: Date, isToday: boolean }  // KST 기준
```
- [ ] 테스트: KST 수요일 18:00 → 수요밤예배·isToday true / 수요일 19:30 → 목요일 새벽예배 / 토요일 06:00 → 주일오전 / 주일 12:00 → 주일오후. `now`는 `new Date('2026-10-07T09:00:00Z')`처럼 UTC로 주고 KST 변환 검증
- [ ] `node --test` (Node 24 타입 스트리핑) FAIL → 구현 → PASS → 커밋

### Task 10: HeroLight 셰이더

**Files:** `npm i ogl`; Create `src/components/three/HeroLight.tsx`
- [ ] ogl Renderer(alpha, dpr ≤1.5) + Triangle + Program: god rays(각도 uniform, 시간, 노이즈) + 입자, 출력 알파 ≤0.35
- [ ] 마우스 x로 각도 ±5° lerp, IntersectionObserver로 화면 밖 정지, `visibilitychange` 정지, 언마운트 시 `gl.getExtension('WEBGL_lose_context')?.loseContext()`
- [ ] reduced-motion·WebGL 실패 → null 반환(부모의 CSS 그라디언트가 대체)
- [ ] 커밋

### Task 11: 홈 7개 섹션

**Files:** Create `src/components/home/{HomeHero,WorshipStrip,NumbersBand,RecentSermons,MissionTeaser,NewsSection,VisitBand}.tsx`; Rewrite `src/app/page.tsx`; Delete `src/components/HeroSlider.tsx`
- [ ] HomeHero: `home.hero` 블록 문구, 사진 Ken Burns(CSS keyframes scale 1→1.12, 8s, 교차 페이드), HeroLight, SplitHeading, 스크롤 유도. `data-hero`
- [ ] WorshipStrip: `nextWorship(new Date())` 강조 배지 + 5개 카드(가로 스크롤 스냅, 데스크톱 그리드)
- [ ] NumbersBand: 창립 1946 → `KST 올해 - 1946`년, 선교지 수, 다음세대 부서 수(hub next-gen 게시판 수) CountUp
- [ ] RecentSermons: hub sermons 최신 3, 큰 카드 1 + 작은 2, VideoModal(Task 15 이전이면 링크로 → Task 15에서 교체)
- [ ] MissionTeaser: 정지 이미지(`public/images/mission-globe.webp` — Task 18에서 캡처, 그 전엔 SVG 지도) + 선교지 수 + 링크
- [ ] NewsSection: 공지 3, 다가오는 행사 3(KST), 갤러리 띠(썸네일 있는 board_posts 최신 12, CSS marquee, hover 정지, reduced-motion 정지)
- [ ] VisitBand: 주소·예배시간·오시는길 버튼
- [ ] 브라우저 확인, Lighthouse 홈 측정 기록, 커밋

---

## Phase 4 — 콘텐츠 페이지

### Task 12: /about, /worship, /directions
- [ ] `/about`: greeting(대형 세리프 인용 + 담임목사 사진 블록 이미지), vision(본문 HTML을 섹션 카드로), 7대 목표는 vision HTML 내 그대로
- [ ] `/worship`: worship.intro + WORSHIPS 카드 + 주보 링크
- [ ] `/directions`: directions.guide 블록 + 기존 카카오맵
- [ ] 커밋

### Task 13: /about/history
- [ ] 데스크톱 ≥1024 & !reduced-motion: 섹션 pin + 가로 트랙 scrub(ScrollTrigger, `end: () => '+=' + track.scrollWidth`), 연도별 그룹, 진행 막대. 그 외: 세로 타임라인
- [ ] 커밋

### Task 14: /about/people
- [ ] 역대 담임교역자 세로 타임라인, 직분별 사진 그리드(구분 순서: 담임목사, 협동목사, 원로장로, 시무장로, 은퇴장로, 협동장로, 안수집사, 은퇴안수집사, 시무권사…, 그 외는 sort_order). 비로그인: hiddenCategories를 "로그인하면 볼 수 있어요" 카드로
- [ ] 커밋

---

## Phase 5 — 허브

### Task 15: VideoModal, VideoCard, HubTabs, HubPage
**Interfaces — Produces:**
- `VideoModal` — 전역 컨텍스트 `useVideoModal().open({ youtubeId, title, href })`, `<dialog>` 기반, 포커스 트랩, Esc, 닫으면 iframe 제거
- `VideoCard({ post, href, size: 'lg'|'md' })` — 썸네일 hover 확대, 클릭 시 모달
- `HubTabs({ tabs: {slug,label,count}[], active })` — `role=tablist`, 좌우 키, `?tab=` 링크
- `HubPage({ hub: HubKey, searchParams })` — 서버 컴포넌트: introKey 블록, 탭 = `boards where hub = key order by tab_order`, 활성 탭 글 목록(페이지네이션 기존 컴포넌트), video 허브는 상단 최신 영상 대형 카드
- [ ] 구현 → 커밋

### Task 16: 허브 라우트 6개 + 상세 링크
**Files:** Create `src/app/{sermons,praise,next-gen,fellowship,discipleship}/page.tsx`; Modify `src/app/board/[slug]/[id]/page.tsx`(목록 링크 → `hubPathForBoard`), `src/app/board/[slug]/page.tsx`(허브 소속이면 redirect), `src/app/board/page.tsx`(about 제외)
- [ ] 각 페이지는 `<HubPage hub='…' />` + metadata → 브라우저 확인 → 커밋

---

## Phase 6 — 선교 3D

### Task 17: MissionGlobe + 대체 지도 + /mission
**Files:** `npm i react-globe.gl three`; Create `public/geo/countries-110m.json`(Natural Earth 110m, world-atlas `countries-110m.json` → GeoJSON 변환, ≤ 250KB), `src/components/three/MissionGlobe.tsx`, `MissionMapFallback.tsx`, `src/app/mission/page.tsx`
- [ ] MissionGlobe: hexPolygons(크림/차콜), 대기 #D4A843 약하게, arcs 순천(34.95,127.49)→각 선교지 금색 dash 애니메이션, htmlElements 핀(버튼, aria-label), 클릭 시 `pointOfView` 이동 + 패널. 자동회전(reduced-motion 정지)
- [ ] 판별: WebGL 없음 || reduced-motion || (터치 && hardwareConcurrency ≤ 4) → MissionMapFallback(SVG equirectangular 투영 점 지도 + 핀)
- [ ] /mission: 지구본 전체 화면(스크롤 시 scale 0.6·translateY) + 선교지 카드 + 허브 탭(mission)
- [ ] 홈 MissionTeaser 정지 이미지 캡처 저장
- [ ] 커밋

---

## Phase 7 — 마무리

### Task 18: 점검·문서
- [ ] Lighthouse 모바일(홈, /sermons, /mission) 기준 충족, 미달 항목 수정
- [ ] 키보드 내비(메가 메뉴, 탭, 모달), reduced-motion 에뮬레이션, WebGL off 대체 확인
- [ ] CLAUDE.md(구조·허브·콘텐츠 테이블·모션 규칙), design.md(시네마틱 토큰·모션 원칙) 갱신
- [ ] 커밋, push, PR
