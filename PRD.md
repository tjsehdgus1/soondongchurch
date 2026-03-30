# 교회 홈페이지 PRD (Product Requirements Document)

> 이 문서는 새로운 교회 홈페이지 프로젝트를 처음부터 동일하게 구현할 수 있도록 작성된 요구사항 명세서입니다.
> AI에게 이 파일을 제공하면 동일한 기능을 가진 홈페이지를 개발할 수 있습니다.

---

## 1. 프로젝트 개요

### 목적
교회 공식 홈페이지. 교인 대상 설교 영상 아카이브, 주보 PDF 뷰어, 소그룹 게시판과 관리자 대상 교인 관리, 일정/공지 관리, AI 설교 자동 요약 기능을 제공한다.

### 기술 스택

| 항목 | 선택 |
|------|------|
| 프레임워크 | Next.js (App Router, Turbopack) |
| 언어 | TypeScript (strict) |
| 스타일 | Tailwind CSS v4 (설정 파일 없음, `@tailwindcss/postcss` 사용) |
| 백엔드/DB | Supabase (PostgreSQL + Auth + Storage) |
| 인증 | Supabase Auth (`@supabase/ssr`, SSR 쿠키 기반) |
| AI | Google Gemini 2.5 Flash (`@google/generative-ai`) |
| SMS | Solapi (휴대폰 인증) |
| 에디터 | Tiptap v3 (소그룹 게시글 작성) |
| PDF 뷰어 | react-pdf v10 |
| 배포 | Vercel |

### 권한 체계
- `member` — 일반 교인 (로그인 후 소그룹 기능 이용)
- `admin` — 관리자 (전체 관리 기능)
- 비로그인 — 공개 콘텐츠(설교, 주보, 일정, 공지) 열람만 가능

---

## 2. 디렉토리 구조

```
src/
├── app/
│   ├── page.tsx                          # 홈페이지
│   ├── layout.tsx                        # 루트 레이아웃 (Navbar/Footer)
│   ├── admin/
│   │   ├── layout.tsx                    # 관리자 가드 + AdminSidebar
│   │   ├── AdminSidebar.tsx
│   │   ├── page.tsx                      # 대시보드
│   │   ├── sermons/page.tsx              # 설교 AI 파싱 + 발행
│   │   ├── bulletins/page.tsx            # 주보 업로드
│   │   ├── members/page.tsx              # 교인 관리
│   │   ├── events/page.tsx               # 행사 일정 관리
│   │   ├── notices/page.tsx              # 공지사항 관리
│   │   └── groups/page.tsx               # 소그룹 관리
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx             # SMS 인증 포함
│   │   └── callback/route.ts
│   ├── api/
│   │   ├── admin/
│   │   │   ├── bulletins/route.ts        # GET 목록, POST 메타저장
│   │   │   ├── bulletins/presign/route.ts # Signed URL 발급
│   │   │   ├── bulletins/[id]/route.ts   # DELETE
│   │   │   ├── members/route.ts          # GET 목록, PATCH 수정
│   │   │   ├── groups/route.ts           # GET/POST/DELETE
│   │   │   └── groups/members/route.ts   # GET/POST/DELETE
│   │   ├── auth/
│   │   │   ├── sms/send/route.ts
│   │   │   ├── sms/verify/route.ts
│   │   │   └── logout/route.ts
│   │   └── sermons/
│   │       ├── parse/route.ts            # YouTube → Gemini → DB
│   │       ├── transcript/route.ts       # Edge runtime, YouTube 자막
│   │       └── manage/route.ts           # CRUD
│   ├── bulletins/
│   │   ├── page.tsx                      # 주보 목록
│   │   └── [id]/page.tsx                 # PDF 뷰어
│   ├── events/page.tsx
│   ├── notices/
│   │   └── [id]/page.tsx
│   ├── sermons/
│   │   ├── page.tsx                      # 설교 목록 (검색/필터/페이지네이션)
│   │   └── [id]/page.tsx                 # 설교 상세
│   └── groups/
│       ├── layout.tsx                    # 로그인 + 차단 가드
│       ├── page.tsx                      # 내 소그룹 목록
│       └── [id]/
│           ├── page.tsx                  # 소그룹 게시판
│           ├── new/page.tsx              # 게시글 작성
│           └── posts/[postId]/
│               ├── page.tsx              # 게시글 상세 + 댓글
│               └── edit/page.tsx         # 게시글 수정
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── HeroSlider.tsx                    # 자동 슬라이드 히어로
│   ├── PdfViewer.tsx                     # react-pdf, 반응형
│   └── TiptapEditor.tsx                  # 이미지 붙여넣기 + 업로드
├── lib/
│   ├── admin.ts                          # getServiceClient, verifyAdmin
│   └── supabase/
│       ├── server.ts                     # SSR 쿠키 클라이언트
│       └── client.ts                     # 브라우저 클라이언트
└── middleware.ts                         # 세션 갱신, 접근 제어
```

---

## 3. 데이터베이스 스키마

### profiles
```sql
CREATE TABLE profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username      text UNIQUE NOT NULL,
  name          text,
  email         text,
  phone_number  text,
  role          text DEFAULT 'member',   -- 'admin' | 'member'
  is_blocked    boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);
-- auth.users INSERT 시 자동 생성 트리거 필수
```

### sermons
```sql
CREATE TABLE sermons (
  id              bigserial PRIMARY KEY,
  youtube_id      text UNIQUE NOT NULL,
  title           text,
  sermon_date     date,
  summary         text,
  raw_transcript  text,
  thumbnail_url   text,
  status          text DEFAULT 'draft',  -- 'draft' | 'published'
  tags            text[] NOT NULL DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX idx_sermons_tags ON sermons USING GIN (tags);
```

### bulletins
```sql
CREATE TABLE bulletins (
  id            bigserial PRIMARY KEY,
  title         text NOT NULL,
  bulletin_date date,
  file_url      text,
  file_path     text,
  created_at    timestamptz DEFAULT now()
);
```

### events
```sql
CREATE TABLE events (
  id          bigserial PRIMARY KEY,
  title       text NOT NULL,
  event_type  text,    -- 'worship' | 'event' | 'meeting'
  event_date  date NOT NULL,
  event_time  text,
  location    text,
  description text,
  created_at  timestamptz DEFAULT now()
);
```

### notices
```sql
CREATE TABLE notices (
  id          bigserial PRIMARY KEY,
  title       text NOT NULL,
  content     text,
  author_id   uuid REFERENCES profiles,
  author_name text,
  is_pinned   boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
```

### groups / group_members / group_posts / group_post_comments
```sql
CREATE TABLE groups (
  id          bigserial PRIMARY KEY,
  name        text NOT NULL,
  description text,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE group_members (
  id        bigserial PRIMARY KEY,
  group_id  bigint REFERENCES groups ON DELETE CASCADE,
  user_id   uuid REFERENCES profiles ON DELETE CASCADE,
  UNIQUE(group_id, user_id)
);

CREATE TABLE group_posts (
  id          bigserial PRIMARY KEY,
  group_id    bigint REFERENCES groups ON DELETE CASCADE,
  author_id   uuid REFERENCES profiles,
  author_name text,
  title       text NOT NULL,
  content     text,         -- Tiptap HTML
  image_url   text,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE group_post_comments (
  id          bigserial PRIMARY KEY,
  post_id     bigint REFERENCES group_posts ON DELETE CASCADE,
  group_id    bigint,
  author_id   uuid REFERENCES profiles,
  author_name text,
  content     text,
  created_at  timestamptz DEFAULT now()
);
```

### sms_verifications
```sql
CREATE TABLE sms_verifications (
  id         bigserial PRIMARY KEY,
  phone      text NOT NULL,
  code       text NOT NULL,
  verified   boolean DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

### Storage Buckets
- `bulletins` — PDF 주보, 최대 20MB, public read
- `group-images` — 소그룹 이미지, 최대 10MB, public read

---

## 4. 환경 변수

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_SENDER=               # SMS 발신 번호 (등록된 번호)
MIGRATE_SECRET=              # DB 초기화 API 보호용 (선택)
```

---

## 5. 인증 시스템

### 로그인 방식
Supabase Auth는 이메일 형식을 요구하므로 아이디(username)를 가상 이메일로 변환한다.
```
{username}@internal.church
```

### 세션 처리 규칙
- 로그인/회원가입 성공 후 반드시 `window.location.href = '/'` 사용 (router.push 금지)
  - 이유: router.push()는 세션 쿠키가 미확립된 상태로 이동해 무한 pending 발생
- 로그아웃: `POST /api/auth/logout` → `window.location.href = '/auth/login'`
- 미들웨어에서 모든 요청마다 `getUser()` 호출하여 세션 토큰 자동 갱신

### 회원가입 SMS 인증 플로우
1. 휴대폰 번호 입력 → `POST /api/auth/sms/send`
2. Solapi SDK로 6자리 코드 SMS 발송 (5분 유효)
3. 코드 입력 → `POST /api/auth/sms/verify`
4. 인증 완료 후 회원가입 진행
5. SMS 메시지 형식: `[교회명] 인증번호는 {code}입니다. 5분 이내에 입력해 주세요.`

### 미들웨어 접근 제어
- `/admin/*`, `/groups/*` → 미로그인 시 `/auth/login` 리다이렉트
- `is_blocked` 체크는 미들웨어에서 하지 않고 각 레이아웃에서 처리 (모든 요청마다 DB 왕복 방지)
- 차단된 교인 → `/auth/login?blocked=1` 리다이렉트

---

## 6. Supabase 클라이언트 사용 규칙

| 상황 | 클라이언트 |
|------|-----------|
| 서버 컴포넌트, API 라우트 (일반) | `createClient()` from `@/lib/supabase/server` |
| `'use client'` 컴포넌트 | `createClient()` from `@/lib/supabase/client` |
| 관리자 API (RLS 우회 필요) | `getServiceClient()` from `@/lib/admin` + `verifyAdmin()` 선행 |

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

**주의**: 브라우저 클라이언트는 컴포넌트 함수 내부에서 매번 생성할 것. 모듈 레벨 싱글톤 금지.
- 이유: Next.js SSR 프리렌더링 중 모듈 레벨 인스턴스 캐싱 시 무한 pending 발생

---

## 7. 기능 상세 요구사항

### 7-1. 홈페이지 (`/`)

**서버 컴포넌트. 다음 섹션으로 구성한다.**

**[Hero 슬라이더]**
- 2~3장의 이미지를 5초 간격 자동 전환 (CSS opacity transition)
- 교회 슬로건 텍스트 오버레이
- 유튜브 채널 링크 버튼
- "교인 등록하기" 버튼 (비로그인 시에만 표시)

**[예배 안내]**
- 정기 예배 시간표 카드 (정적 데이터)
- hover 시 이미지 scale 애니메이션
- 스크롤 시 순차 등장 애니메이션

**[최근 설교]**
- `sermons` 테이블 `status='published'` 최신 2건
- 썸네일 + 날짜 + 제목 + 요약 카드

**[행사/공지]**
- 다가오는 행사 3건 (오늘 이후, 날짜순)
- 최신 공지 3건 (고정→최신 순)

**[교회 비전]**
- 정적 콘텐츠 (예배/기도/선교 3개 카드)

---

### 7-2. 설교영상 (`/sermons`)

**목록 페이지 (서버 컴포넌트, ISR 5분 캐시)**
- 텍스트 검색 (`?q=`): 제목 + 요약 ilike 검색
- 태그 필터 (`?tag=`): tags 배열 contains 쿼리
- 페이지네이션: 12건/페이지, `?page=` URL 파라미터
- 카드: 썸네일 + 날짜 + 제목 + 요약(3줄 말줄임) + 태그 뱃지 (최대 2개 + 초과수)
- 사이드 또는 상단에 전체 태그 목록 필터 버튼 표시

**상세 페이지 (`/sermons/[id]`)**
- YouTube iframe embed (16:9, rel=0)
- 설교 날짜 + 제목 + 설교자 이름 + 소속교회
- 태그 클릭 시 `/sermons?tag={tag}` 이동
- AI 요약 박스 (있을 경우)
- status='published' 조건 검증, 없으면 404

---

### 7-3. 주보 (`/bulletins`)

**목록 페이지**: 날짜 최신순, 제목 + 날짜 + "보기" 링크

**상세 페이지 (`/bulletins/[id]`)**
- `PdfViewer` 컴포넌트로 브라우저 내 PDF 렌더링
- react-pdf 사용, 창 너비에 맞게 자동 리사이즈

---

### 7-4. 행사 일정 (`/events`)

**서버 컴포넌트, ISR 5분 캐시**
- 다가오는 일정: 오늘 이후 전체, 날짜 오름차순
- 지난 일정: 최대 5건, opacity 60% 처리
- 분류 색상: 예배(파랑), 행사(보라), 모임(초록)

---

### 7-5. 공지사항 (`/notices/[id]`)

- 제목 + 작성자 + 등록일 + 수정일(변경된 경우만)
- 중요 공지(is_pinned) 뱃지 표시
- 본문 whitespace-pre-wrap 처리
- `generateMetadata`로 페이지 title 동적 생성

---

### 7-6. 소그룹 기능 (`/groups/*`)

**공통 접근 제어** (groups/layout.tsx)
- 미로그인 → `/auth/login` 리다이렉트
- `is_blocked=true` → `/auth/login?blocked=1` 리다이렉트

**소그룹 목록 (`/groups`)**
- 현재 로그인 교인이 소속된 그룹만 표시
- admin은 모든 그룹 접근 가능

**소그룹 게시판 (`/groups/[id]`)**
- 그룹 소속 여부 확인 (admin 제외)
- 게시글 목록: 썸네일 + 제목 + 본문 미리보기 + 작성자 + 날짜
- "글쓰기" 버튼 → `/groups/{id}/new`

**게시글 작성/수정**
- Tiptap 에디터 (이미지 붙여넣기 시 Supabase Storage 자동 업로드)
- 제목 + 본문 + 이미지 첨부

**게시글 상세 + 댓글 (`/groups/[id]/posts/[postId]`)**
- 본문: `dangerouslySetInnerHTML` + `DOMPurify.sanitize` (XSS 방지 필수)
- 수정/삭제: 본인 글 또는 admin
- 댓글 작성/삭제: 본인 댓글 또는 admin

---

### 7-7. 관리자 - 설교 관리 (`/admin/sermons`)

**신규 설교 등록 플로우**
1. 관리자가 YouTube URL + 설교 날짜 입력
2. Edge 라우트(`/api/sermons/transcript`)로 자막 우선 취득
   - 이유: Vercel Lambda의 AWS IP를 YouTube가 차단 → Edge Network IP 사용
3. `/api/sermons/parse`에 자막 포함 전송
4. Gemini 2.5 Flash로 요약 + 태그 동시 생성 (JSON 형식 응답)
5. `sermons` 테이블에 `status='draft'`로 저장

**Gemini 프롬프트 형식**
```
설교를 분석하여 아래 JSON 형식으로만 응답해주세요.
{
  "summary": "설교 핵심 메시지를 100자 이내 한 문장으로 (정중한 격식체, ~입니다)",
  "tags": ["성경 본문", "주제", "키워드", ...] // 3~7개, 한국어
}
```

**YouTube 자막 취득 방식**
- YouTube InnerTube ANDROID 클라이언트 API 직접 호출 (라이브러리 미사용)
- POST `https://www.youtube.com/youtubei/v1/player` with Android User-Agent
- 자막 XML 요청 시 Browser User-Agent 필수 (없으면 0 bytes 반환)
- 한국어(ko) 우선, 없으면 첫 번째 트랙 사용
- XML 파싱: `<text>` 형식과 `<p><s>` 형식 둘 다 처리

**설교 목록 관리**
- 썸네일 + 날짜 + 제목 + 요약 + 태그 + 상태 표시
- 수정 모달: 제목, 날짜, 태그, 요약 편집 가능
- 태그 입력: Enter 또는 "추가" 버튼, ✕로 개별 삭제, 중복 방지
- draft ↔ published 토글 버튼
- 삭제 버튼

---

### 7-8. 관리자 - 주보 관리 (`/admin/bulletins`)

**Presigned URL 방식 업로드** (서버 대역폭 절약)
1. `/api/admin/bulletins/presign` POST → Storage 서명 URL 발급
2. 클라이언트에서 서명 URL로 직접 PUT 업로드
3. `/api/admin/bulletins` POST → DB 메타데이터 저장

**파일 경로 규칙**: `{bulletinDate}_{timestamp}.pdf`
**최대 파일 크기**: 20MB

---

### 7-9. 관리자 - 교인 관리 (`/admin/members`)

- 전체 교인 목록 (이름/아이디/이메일/휴대폰/권한/소속그룹/상태/가입일)
- 실시간 검색 필터 (이름/아이디/이메일/전화번호, 클라이언트 사이드)
- 수정 모달: 이름, 이메일, 휴대폰, 권한(member↔admin) 변경
- 차단/해제 토글: `is_blocked` 반전

---

### 7-10. 관리자 - 행사 관리 (`/admin/events`)

**등록 폼**
- 제목 (필수)
- 분류: `worship`(정규예배) / `event`(특별행사) / `meeting`(모임회의)
- 날짜 (필수), 시간 (선택), 장소 (선택), 설명 (선택)

---

### 7-11. 관리자 - 공지사항 관리 (`/admin/notices`)

- 제목 + 본문 + 중요 공지 여부 작성
- 작성자: 현재 로그인 관리자의 `profiles.name` 자동 사용
- 📌 버튼으로 `is_pinned` 토글

---

### 7-12. 관리자 - 소그룹 관리 (`/admin/groups`)

- 소그룹 생성 (이름, 설명)
- 멤버 추가/제거 모달
  - 전체 교인 dropdown에서 선택 (이미 소속된 교인 자동 제외)
- 그룹 삭제 (게시글 + 멤버십 CASCADE 삭제 경고)

---

### 7-13. 관리자 대시보드 (`/admin`)

병렬 조회로 다음 3가지 지표 카드 표시:
- 등록된 교인 수 (→ 교인 관리)
- 다가오는 일정 수 (→ 행사 관리)
- 전체 공지사항 수 (→ 공지 관리)

---

## 8. API 엔드포인트 명세

### 공개 API (인증 불필요)
없음 (모든 공개 데이터는 서버 컴포넌트에서 직접 Supabase 조회)

### 인증 API
| 메서드 | 경로 | 기능 |
|--------|------|------|
| POST | `/api/auth/sms/send` | SMS 인증번호 발송 |
| POST | `/api/auth/sms/verify` | SMS 인증번호 확인 |
| POST | `/api/auth/logout` | 서버사이드 세션 삭제 |
| GET | `/api/auth/callback` | OAuth 코드 교환 |

### 설교 API (admin)
| 메서드 | 경로 | 기능 |
|--------|------|------|
| POST | `/api/sermons/transcript` | YouTube 자막 취득 (Edge runtime) |
| POST | `/api/sermons/parse` | Gemini AI 요약+태그 생성 + DB 저장 (maxDuration=60) |
| GET | `/api/sermons/manage` | 전체 설교 목록 (draft 포함) |
| PUT | `/api/sermons/manage` | 제목/날짜/요약/태그 수정 |
| PATCH | `/api/sermons/manage` | status 토글 |
| DELETE | `/api/sermons/manage` | 삭제 |

### 주보 API (admin)
| 메서드 | 경로 | 기능 |
|--------|------|------|
| GET | `/api/admin/bulletins` | 목록 조회 |
| POST | `/api/admin/bulletins` | 메타데이터 저장 |
| POST | `/api/admin/bulletins/presign` | Storage 서명 URL 발급 |
| DELETE | `/api/admin/bulletins/[id]` | 삭제 |

### 교인 API (admin)
| 메서드 | 경로 | 기능 |
|--------|------|------|
| GET | `/api/admin/members` | 전체 교인 목록 (소속 그룹 포함) |
| PATCH | `/api/admin/members` | 교인 정보 수정 |

### 소그룹 관리 API (admin)
| 메서드 | 경로 | 기능 |
|--------|------|------|
| GET | `/api/admin/groups` | 소그룹 목록 |
| POST | `/api/admin/groups` | 소그룹 생성 |
| DELETE | `/api/admin/groups` | 소그룹 삭제 |
| GET | `/api/admin/groups/members` | 멤버 목록 |
| POST | `/api/admin/groups/members` | 멤버 추가 |
| DELETE | `/api/admin/groups/members` | 멤버 제거 |

---

## 9. API 응답 형식 규칙

```typescript
// 성공
NextResponse.json({ success: true, data: ... })

// 에러
NextResponse.json({ error: '메시지' }, { status: 400 | 401 | 403 | 500 })

// 에러 타입 처리
} catch (error: unknown) {
  return NextResponse.json({
    error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.'
  }, { status: 500 })
}
```

---

## 10. 코딩 규칙 및 주의사항

### 날짜 파싱 (타임존 버그 방지)
```typescript
// 잘못된 방법 — UTC로 파싱되어 KST에서 하루 이전 날짜 표시
new Date('2024-03-24')

// 올바른 방법
new Date('2024-03-24' + 'T00:00:00')
```

### XSS 방지 (HTML 렌더링 시 필수)
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

### useEffect 의존성 배열
```typescript
// admin/layout.tsx 등에서 loading 상태를 의존성 배열에 넣지 말 것
// 이유: loading이 변경될 때마다 effect가 재실행되어 API 중복 호출 발생
useEffect(() => {
  fetchData()
}, []) // loading 제외
```

---

## 11. 디자인 시스템

### 컬러 팔레트 (Warm Editorial)
- Primary: `amber-700` (`#b45309`)
- Background: `stone-50` (`#fafaf9`)
- Text: `stone-800` (`#292524`)
- Border: `stone-200` (`#e7e5e4`)
- Admin Accent: `blue-600`

### 공통 UI 패턴
- 카드: `bg-white rounded-xl shadow-sm border border-stone-200`
- 버튼 Primary: `bg-amber-700 text-white hover:bg-amber-800`
- 태그/뱃지: `bg-amber-100 text-amber-800 rounded-full px-2 py-0.5 text-xs`
- 관리자 사이드바: 고정 좌측, 모바일 미표시

### 폰트
- UI 전반: Pretendard (CDN)
- 본문/강조: Noto Serif KR (Google Fonts)

---

## 12. 관리자 계정 초기 설정

Supabase Auth의 이메일 인증 Rate Limit 우회를 위해 수동 생성:
1. Supabase Dashboard → Authentication → Users → "Add user"
   - Email: `admin@{교회도메인}.com`
   - Auto Confirm User: ON
2. SQL Editor에서 실행:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@{교회도메인}.com';
```

---

## 13. 페이지별 권한 매트릭스

| 경로 | 비로그인 | member | admin |
|------|---------|--------|-------|
| `/` | 읽기 | 읽기 | 읽기 |
| `/sermons/*` | 읽기 | 읽기 | 읽기 |
| `/bulletins/*` | 읽기 | 읽기 | 읽기 |
| `/events` | 읽기 | 읽기 | 읽기 |
| `/notices/*` | 읽기 | 읽기 | 읽기 |
| `/auth/login` | 접근 | 불필요 | 불필요 |
| `/auth/register` | 접근 | 불필요 | 불필요 |
| `/groups` | 리다이렉트 | 내 그룹만 | 모든 그룹 |
| `/groups/[id]` | 리다이렉트 | 소속 그룹만 | 전체 |
| `/groups/[id]/posts/*` | 리다이렉트 | 소속 + 본인 수정/삭제 | 전체 삭제 |
| `/admin/*` | 리다이렉트 | 리다이렉트 | 전체 접근 |

---

## 14. 외부 서비스 설정 체크리스트

- [ ] Supabase 프로젝트 생성 및 위 스키마 실행
- [ ] Supabase Storage 버킷 생성 (`bulletins`, `group-images`) + public read 정책
- [ ] Supabase Auth → profiles 자동 생성 트리거 설정
- [ ] Google AI Studio에서 Gemini API 키 발급
- [ ] Solapi 계정 생성 + 발신번호 등록 + API 키 발급
- [ ] Vercel 배포 + 환경 변수 설정
- [ ] 관리자 계정 수동 생성 (12번 항목 참고)
