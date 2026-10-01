# 순천순동교회 홈페이지 — Claude 컨텍스트

## 프로젝트 개요

순천순동교회 공식 홈페이지. Next.js 16 App Router + Supabase 기반.
소그룹 게시판, 교인 관리, 주보 PDF 뷰어 포함.
설교 AI 자동요약·설교 관리 기능은 2026-10-01 **의도적으로 삭제**됨 — 임의로 되살리지 말 것.
설교 영상은 네이버 카페 이관으로 만든 **일반 게시판(유튜브 영상 첨부, AI 없음)**으로 운영한다 (`doc/cafe_migration_design.md`).

## 스택

| 항목 | 버전 / 내용 |
|------|------------|
| Next.js | 16.1.6 (App Router, Turbopack) |
| React | 19.2.3 |
| TypeScript | 5.x (strict) |
| Tailwind CSS | 4.x (`@tailwindcss/postcss`, 설정 파일 없음) |
| Supabase | `@supabase/ssr` 0.9.x (SSR 쿠키 기반) |
| Tiptap | 3.x (소그룹 게시글 에디터) |
| React PDF | 10.x (주보 PDF 뷰어) |
| Solapi | 5.x (SMS 인증) |

## 디렉토리 구조

```
src/
├── app/
│   ├── page.tsx                    # 홈 (hero, 예배, 행사, 공지)
│   ├── layout.tsx                  # 루트 레이아웃 (Navbar/Footer 포함)
│   ├── admin/
│   │   ├── layout.tsx              # 관리자 가드 + AdminSidebar
│   │   ├── AdminSidebar.tsx
│   │   ├── page.tsx                # 대시보드
│   │   ├── members/page.tsx        # 교인 관리 (차단/권한 변경)
│   │   ├── boards/page.tsx         # 게시판 관리 (추가·순서·글쓰기 권한·부서)
│   │   ├── bulletins/page.tsx      # 주보 업로드
│   │   ├── events/page.tsx
│   │   ├── groups/page.tsx
│   │   └── notices/page.tsx
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx       # SMS 인증 포함
│   │   └── callback/route.ts
│   ├── api/
│   │   ├── admin/
│   │   │   ├── bulletins/route.ts         # GET(목록), POST(메타저장)
│   │   │   ├── bulletins/presign/route.ts # Signed URL 발급
│   │   │   ├── bulletins/[id]/route.ts    # DELETE
│   │   │   ├── members/route.ts           # GET(목록), PATCH(수정)
│   │   │   └── boards/route.ts            # 게시판 CRUD
│   │   ├── board-images/[...path]/route.ts # 회원 전용 글 이미지 → 서명 URL 리다이렉트
│   │   ├── auth/
│   │   │   ├── sms/send/route.ts
│   │   │   ├── sms/verify/route.ts
│   │   │   ├── register/route.ts   # SMS 인증 확인 후 계정 생성 (service role)
│   │   │   └── logout/route.ts
│   │   └── setup/migrate/route.ts  # DB 초기화 (MIGRATE_SECRET 필요)
│   ├── board/                      # 게시판: 전체글, [slug] 목록, [slug]/[id] 상세, new, edit
│   ├── bulletins/[id]/page.tsx     # PdfViewer
│   ├── events/page.tsx
│   ├── groups/[id]/posts/[postId]/ # 소그룹 게시글 (detail, edit)
│   └── notices/[id]/page.tsx
├── components/
│   ├── Navbar.tsx                  # 고정 헤더, 섹션별 드롭다운 (boards 테이블 기반), auth 상태 동기화
│   ├── BoardPostList.tsx           # 게시글 목록 (list/card)
│   ├── BoardPostForm.tsx           # 게시글 작성·수정
│   ├── Footer.tsx
│   ├── HeroSlider.tsx
│   ├── PdfViewer.tsx               # react-pdf, resize 지원
│   └── TiptapEditor.tsx            # 이미지 붙여넣기 + 업로드
├── lib/
│   ├── admin.ts                    # getServiceClient, verifyAdmin (공통)
│   ├── boards.ts                   # 게시판 타입, 메뉴 섹션 순서(SECTION_ORDER), 유튜브 파싱, KST 날짜
│   └── supabase/
│       ├── server.ts               # SSR 쿠키 클라이언트
│       └── client.ts               # 브라우저 클라이언트
└── proxy.ts                        # 세션 갱신, 로그인 필요 경로 보호 (Next 16: middleware → proxy)
```

---

## Supabase 클라이언트 사용 규칙

| 상황 | 사용 클라이언트 |
|------|----------------|
| 서버 컴포넌트, API 라우트 (일반 RLS) | `createClient()` from `@/lib/supabase/server` |
| `'use client'` 컴포넌트 | `createClient()` from `@/lib/supabase/client` |
| 관리자 전용 API 라우트 (RLS 우회) | `getServiceClient()` from `@/lib/admin` + `verifyAdmin()` 선행 |

```typescript
// 관리자 API 라우트 표준 패턴
import { getServiceClient, verifyAdmin } from '@/lib/admin'

export async function GET() {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

    const supabase = getServiceClient()
    // ...
}
```

---

## DB 스키마

### profiles
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid | PK, FK → auth.users |
| username | text | 로그인 ID |
| name | text | 이름 |
| email | text | 실제 이메일 (선택) |
| phone_number | text | |
| role | text | `'admin'` \| `'member'` (기본값) |
| is_blocked | boolean | true 시 접근 차단 |
| created_at | timestamp | |

### boards / board_posts (게시판)
- boards: slug, name, section(상단 메뉴 그룹), kind(`list`|`card`), write_level(`admin`|`group`|`member`), group_id(부서 = groups), categories(말머리), sort_order
- board_posts: board_id, author_id/author_name(트리거가 설정), category, title, content(HTML), youtube_id, thumbnail_url, is_pinned, members_only, cafe_article_id(카페 원본)
- 글쓰기 권한은 DB 함수 `can_write_board(bid)`, 회원 전용 글은 `members_only` + RLS
- 이미지: `board-images`(공개), `board-private`(회원 전용 글, `/api/board-images/...`로만 접근)
- 새 게시판 섹션을 추가하면 `src/lib/boards.ts`의 `SECTION_ORDER`에도 추가

### bulletins
| 컬럼 | 타입 |
|------|------|
| id | bigserial |
| title | text |
| bulletin_date | date |
| file_url | text |
| file_path | text |

### groups / group_members / group_posts
- groups: id, name, description
- group_members: group_id, user_id (CASCADE)
- group_posts: group_id, author_id, author_name, title, content(HTML), image_url

### events / notices
- events: id, title, event_date, event_time, event_type (`worship`|`event`|`meeting`), location
- notices: id, title, content, is_pinned

### sms_verifications
- phone, code(6자리), verified, expires_at (5분)

### Storage Buckets
- `bulletins/` — PDF 주보, 최대 20MB
- `group-images/` — 소그룹 게시글 이미지, 최대 10MB
- `board-images/` — 게시판 이미지(공개), `board-private/` — 회원 전용 글 이미지(비공개)

---

## 인증 시스템

**로그인 방식:** username → 내부 이메일 변환
```
{username}@internal.church
```

**세션 후 리다이렉트:** 반드시 `window.location.href` 사용, `router.push()` 금지
```typescript
// 로그인/회원가입 성공 후
window.location.href = '/'
// 이유: router.push()는 세션 쿠키가 미확립된 상태로 이동해 무한 pending 발생
```

**접근 제어:**
- `proxy.ts`: `/admin/*`, `/groups/*` → 미로그인 시 `/auth/login` 리다이렉트
- `admin/layout.tsx`, `groups/layout.tsx`: `is_blocked = true` → `/auth/login?blocked=1` 리다이렉트
- DB: 차단 회원은 관리자 권한 무효(`is_admin()`), 글·댓글 작성 불가(트리거)

**회원가입:** 클라이언트 `signUp` 사용 금지 — `POST /api/auth/register`가 SMS 인증 기록을 확인 후 `auth.admin.createUser`로 생성.
Supabase 대시보드 Authentication → Sign In / Providers → **Allow new users to sign up 끔** (우회 가입 차단).

**RLS 원칙 (supabase/20261001_security_fix.sql):**
- profiles: 본인·관리자만 SELECT, 클라이언트 UPDATE 불가 (수정은 관리자 API만)
- sms_verifications: 정책 없음 → service role 전용
- group_posts/comments: author_id·author_name은 트리거가 강제 설정

**로그아웃:**
- `POST /api/auth/logout` (서버사이드 쿠키 삭제)
- 클라이언트에서 `window.location.href = '/auth/login'`

---

## 주요 패턴 & 주의사항

### API 응답 형식
```typescript
// 성공
NextResponse.json({ success: true, data: ... })
// 에러
NextResponse.json({ error: '메시지' }, { status: 400|401|403|500 })
```

### 에러 타입 처리
```typescript
} catch (error: unknown) {
    return NextResponse.json({
        error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.'
    }, { status: 500 })
}
```

### 날짜 파싱 (타임존 버그 방지)
```typescript
// 잘못된 방법: UTC로 파싱되어 KST에서 하루 이전 날짜 표시
new Date('2024-03-24')
// 올바른 방법
new Date('2024-03-24' + 'T00:00:00')
```

### XSS 방지 (dangerouslySetInnerHTML)
```typescript
import DOMPurify from 'isomorphic-dompurify'
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
```

### window 접근 (SSR 하이드레이션 방지)
```typescript
// 잘못된 방법
const width = typeof window !== 'undefined' ? window.innerWidth : 800
// 올바른 방법
const [width, setWidth] = useState(800)
useEffect(() => { setWidth(window.innerWidth) }, [])
```

### Supabase 브라우저 클라이언트
```typescript
// 컴포넌트 최상단에 직접 호출 (모듈 레벨 싱글톤 금지)
const supabase = createClient()
// 이유: Next.js SSR 프리렌더링 중 모듈 레벨 인스턴스 캐싱 시 무한 pending
```

---

## 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ACCESS_TOKEN=       # DB 초기화 migrate API 전용
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_SENDER=               # SMS 발신 번호
MIGRATE_SECRET=              # /api/setup/migrate 보호용
```

---

## DB 변경 적용

스키마·정책 변경은 `supabase/*.sql` 파일로 작성 후 **대시보드 SQL Editor에서 직접 실행**.
신규 DB: `schema.sql` → `supabase/20261001_security_fix.sql` → `supabase/20261001_boards.sql` 순서.

카페 이관: `node --env-file=.env.local scripts/cafe-import.mjs [--dry-run]` (원본 `scsdc-cafe-export/`는 gitignore — 커밋 금지)

## 관리자 계정 생성 방법

이메일 인증 Rate Limit 우회를 위해 수동 생성:
1. Supabase Dashboard → Authentication → Users → "Add user" (email: `admin@church.com`, Auto Confirm 체크)
2. SQL Editor에서 실행:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'admin@church.com';
   ```
