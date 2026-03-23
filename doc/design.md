# 순천순동교회 홈페이지 디자인 시스템

## 1. 컨텐츠 기준 폭 (Layout Container)

모든 페이지의 컨텐츠 영역은 **1300px** 를 기준으로 합니다.

```html
<!-- 반드시 이 패턴 사용 -->
<div class="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
  ...
</div>
```

- `max-w-[1300px]` : 최대 너비 1300px
- `mx-auto` : 화면 중앙 정렬
- `px-4 sm:px-6 lg:px-8` : 반응형 좌우 패딩 (모바일 16px / 태블릿 24px / 데스크톱 32px)

> **주의:** `max-w-4xl`, `max-w-5xl`, `max-w-6xl` 등 다른 기준은 공개 페이지에서 사용하지 않습니다.
> 관리자 레이아웃 내부 컨텐츠 (사이드바 + 메인) 구조에서는 예외 허용.

---

## 2. 컬러 팔레트 (Color Palette)

| 용도 | 클래스 | Hex |
|------|--------|-----|
| 주 브랜드 (파랑) | `blue-600` | #2563eb |
| 주 브랜드 호버 | `blue-700` | #1d4ed8 |
| 강조 (황금/앰버) | `amber-400` / `amber-500` | #fbbf24 / #f59e0b |
| 관리자 포인트 | `indigo-600` | #4f46e5 |
| 위험/삭제 | `red-500` / `red-600` | #ef4444 / #dc2626 |
| 배경 (섹션 교차) | `bg-white` / `bg-gray-50` | #ffffff / #f9fafb |
| 텍스트 기본 | `gray-900` | #111827 |
| 텍스트 보조 | `gray-500` | #6b7280 |
| 텍스트 라벨 | `gray-400` | #9ca3af |
| 테두리 | `gray-100` / `gray-200` | #f3f4f6 / #e5e7eb |
| 푸터 배경 | `gray-900` | #111827 |

---

## 3. 타이포그래피 (Typography)

| 요소 | 클래스 |
|------|--------|
| 페이지 대제목 (Hero) | `text-5xl md:text-6xl lg:text-7xl font-extrabold` |
| 섹션 제목 | `text-3xl md:text-4xl font-bold text-gray-900` |
| 섹션 소제목 | `text-2xl font-bold text-gray-900` |
| 섹션 레이블 | `text-sm font-semibold text-blue-600 uppercase tracking-wider` |
| 카드 제목 | `font-bold text-gray-900` |
| 본문 | `text-gray-500 text-sm leading-relaxed` |

---

## 4. 섹션 패딩 (Section Spacing)

```html
<!-- 기본 섹션 -->
<section class="py-20 bg-white">
  <div class="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
    ...
  </div>
</section>

<!-- 섹션 헤더 (제목 + 부제목 묶음) -->
<div class="text-center mb-12">
  <span class="text-blue-600 font-semibold text-sm uppercase tracking-wider">레이블</span>
  <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mt-2">섹션 제목</h2>
  <p class="text-gray-500 mt-3 max-w-lg mx-auto">부제목</p>
</div>
```

- 섹션 간 수직 패딩: `py-20` (80px)
- 섹션 간 배경 교차: `bg-white` ↔ `bg-gray-50` 반복
- 구분선 있는 섹션: `border-y border-gray-100` 추가

---

## 5. 카드 컴포넌트 (Cards)

```html
<!-- 기본 카드 -->
<div class="bg-white rounded-2xl border border-gray-200 shadow-sm
            hover:shadow-xl hover:-translate-y-1.5 transition-all p-5">
  ...
</div>

<!-- 그라디언트 배경 카드 (비전/예배 카드 등) -->
<div class="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-100 rounded-2xl p-6
            hover:shadow-lg hover:-translate-y-1 transition-all">
  ...
</div>
```

---

## 6. 버튼 (Buttons)

```html
<!-- Primary -->
<button class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition-all">
  확인
</button>

<!-- Secondary (외곽선) -->
<button class="px-6 py-3 border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 font-medium rounded-xl transition-colors">
  취소
</button>

<!-- Danger -->
<button class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors">
  삭제
</button>

<!-- 관리자 (Indigo) -->
<button class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">
  관리자
</button>

<!-- 발행/승인 (Green) -->
<button class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors">
  발행
</button>
```

---

## 7. 네비게이션 바 (Navbar)

- 높이: `h-16` (64px), fixed 포지션
- 하위 `<main>` 은 반드시 `pt-16` 으로 여백 확보 (루트 `layout.tsx` 에 적용됨)
- 관리자 계정 로그인 시 "관리자" 버튼이 **공지사항 링크 바로 우측에** 표출 (인디고 컬러)
- 모바일 메뉴에서도 동일하게 공지사항 아래 관리자 링크 배치

---

## 8. 관리자 레이아웃 (Admin Layout)

관리자 페이지는 공개 Navbar/Footer 를 사용하지 않고,
별도 사이드바 레이아웃(`admin/layout.tsx`)으로 독립 구성됩니다.

```
┌──────────────────────────────────────────┐
│ Sidebar (w-64, bg-white)  │ Main Content │
│  - 대시보드 홈             │  (flex-1)   │
│  - 교인 관리               │             │
│  - 설교 요약 관리           │             │
│  - 일정 관리               │             │
│  - 공지사항 관리            │             │
│  ─────────────────         │             │
│  - 교회 홈페이지로 돌아가기  │             │
└──────────────────────────────────────────┘
```

- 관리자 내부 컨텐츠 패딩: `p-6 md:p-8 lg:p-10`
- 관리자 내부 최대 폭: `max-w-4xl` 또는 `max-w-5xl` (사이드바가 이미 폭을 제한하므로 유연하게 사용)

---

## 9. 폼 인풋 (Form Inputs)

```html
<input class="w-full border border-gray-200 rounded-lg p-2.5
              focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none
              text-sm text-gray-900 placeholder:text-gray-400" />
```

---

## 10. 상태 배지 (Status Badges)

```html
<!-- 공개 -->
<span class="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">공개중</span>

<!-- 검토 대기 -->
<span class="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">검토 대기중</span>

<!-- 중요 공지 -->
<span class="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">📌 중요</span>
```
