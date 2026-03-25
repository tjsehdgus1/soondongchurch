# 순천순동교회 디자인 시스템

## 레이아웃

### 페이지 너비
```
최대 너비: max-w-[1300px] mx-auto
패딩: px-4 sm:px-6 lg:px-8
```

### 섹션 수직 간격
```
공개 페이지 섹션: py-20
관리자 페이지: space-y-8
```

### 상단 여백 (Navbar h-16 고정)
- Navbar 아래 컨텐츠: `pt-16` (layout.tsx에서 처리됨)

### 관리자 레이아웃
```
사이드바: w-64 고정 (lg 이상)
컨텐츠 영역: p-6 md:p-8 lg:p-10
```

---

## 색상 팔레트

### 주요 색상 (공개 페이지)
| 용도 | 클래스 |
|------|--------|
| 주요 액션 버튼 | `bg-blue-600 hover:bg-blue-700` |
| 그라데이션 버튼 | `bg-gradient-to-r from-blue-600 to-indigo-600` |
| 텍스트 강조 | `text-blue-600` |
| 황금/앰버 포인트 | `text-amber-400` |
| 섹션 레이블 | `text-blue-600 font-semibold text-sm uppercase tracking-wider` |

### 관리자 색상
| 용도 | 클래스 |
|------|--------|
| 주요 버튼 | `bg-indigo-600 hover:bg-indigo-700` |
| 보조 버튼 | `text-indigo-600 bg-indigo-50 hover:bg-indigo-100` |
| 위험 버튼 | `text-red-500 bg-red-50 hover:bg-red-100` |

### 이벤트 타입 배지
```typescript
const eventTypeMap = {
  worship: { label: '예배',  bg: 'bg-blue-100',   color: 'text-blue-700'   },
  event:   { label: '행사',  bg: 'bg-purple-100',  color: 'text-purple-700' },
  meeting: { label: '모임',  bg: 'bg-green-100',   color: 'text-green-700'  },
}
```

### 상태/역할 배지
```typescript
// 역할
role === 'admin'  → 'bg-purple-100 text-purple-700'
role === 'member' → 'bg-gray-100 text-gray-600'

// 설교 상태
status === 'published' → 'bg-green-100 text-green-700'
status === 'draft'     → 'bg-yellow-100 text-yellow-700'
```

---

## 컴포넌트 패턴

### 카드
```jsx
// 공개 페이지 카드
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">

// 관리자 카드
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
```

### 버튼

**Primary (공개)**
```jsx
<button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
```

**Primary (관리자)**
```jsx
<button className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
```

**Gradient (회원가입/강조)**
```jsx
<button className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg">
```

**Secondary**
```jsx
<button className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
```

**Danger (삭제)**
```jsx
<button className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-md transition-colors">
```

### 폼 인풋
```jsx
<input
  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-shadow"
/>

// 관리자 인풋 (더 작은 패딩)
<input className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
```

### 에러 / 알림 배너
```jsx
// 에러
<div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center gap-2">

// 성공
<div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">

// 정보 (차단)
<div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2 mb-4">
```

### 로딩 스피너
```jsx
<svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
</svg>
```

### 모달
```jsx
{modalOpen && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}
  >
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">제목</h2>
        <button onClick={() => setModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">✕</button>
      </div>
      {/* 컨텐츠 */}
    </div>
  </div>
)}
```

### 섹션 헤더 (공개 페이지)
```jsx
<div className="mb-10">
  <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Section Label</span>
  <h2 className="text-4xl font-extrabold text-gray-900 mt-1">섹션 제목</h2>
  <p className="text-gray-500 mt-2">서브타이틀</p>
</div>
```

### 섹션 헤더 (관리자 페이지)
```jsx
<h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
  <span className="w-2 h-6 bg-indigo-600 rounded-full inline-block" />
  섹션명
</h2>
```

### 빈 상태 (Empty State)
```jsx
<div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
  항목이 없습니다.
</div>
```

### 에러 상태 (+ 재시도 버튼)
```jsx
<div className="p-12 text-center bg-white rounded-2xl border border-red-100">
  <p className="text-red-500 font-medium">데이터를 불러오지 못했습니다.</p>
  <p className="text-sm text-gray-400 mt-1">{errorMessage}</p>
  <button onClick={retry} className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
    다시 시도
  </button>
</div>
```

### 배지 (뱃지)
```jsx
// 작은 텍스트 배지
<span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
  레이블
</span>
```

### 구분선 (Divider)
```jsx
<div className="border-t border-gray-100 my-6" />
```

---

## 타이포그래피

| 용도 | 클래스 |
|------|--------|
| 페이지 대제목 | `text-4xl font-extrabold text-gray-900` |
| 섹션 제목 | `text-2xl font-bold text-gray-900` |
| 카드 제목 | `text-lg font-bold text-gray-900` |
| 본문 | `text-gray-700` |
| 서브텍스트 | `text-sm text-gray-500` |
| 메타/캡션 | `text-xs text-gray-400` |
| 강조 링크 | `text-blue-600 font-semibold hover:underline` |

---

## 관리자 페이지 구조 패턴

모든 관리자 CRUD 페이지는 아래 패턴을 따른다:

```
┌─────────────────────────────────────┐
│ 페이지 제목 + 설명                    │
├───────────┬─────────────────────────┤
│           │ 로딩 중...               │
│  생성 폼  ├─────────────────────────┤
│ (1/3)     │ 에러 시 재시도 버튼       │
│           ├─────────────────────────┤
│           │ 빈 상태 안내             │
│ sticky    ├─────────────────────────┤
│ top-24    │ 항목 카드 목록           │
│           │ (hover shadow 효과)      │
└───────────┴─────────────────────────┘
```

```jsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  {/* 생성 폼 */}
  <div className="lg:col-span-1">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
      ...
    </div>
  </div>

  {/* 목록 */}
  <div className="lg:col-span-2">
    {loading ? <LoadingState /> : error ? <ErrorState /> : items.length === 0 ? <EmptyState /> : <ItemList />}
  </div>
</div>
```

---

## 공개 페이지 카드 그리드

```jsx
// 2열 그리드
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

// 3열 그리드
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

---

## 애니메이션

| 효과 | 클래스 |
|------|--------|
| 호버 섀도우 | `hover:shadow-md transition-shadow` |
| 호버 이동 | `hover:-translate-y-1 transition-all` |
| 이미지 줌 | `group-hover:scale-105 transition-transform duration-300` |
| 색상 전환 | `transition-colors` |
| 전체 전환 | `transition-all` |

---

## 반응형 분기점

| 분기점 | 용도 |
|--------|------|
| `sm:` (640px) | 패딩 조정 |
| `md:` (768px) | 그리드 2열, 레이아웃 전환 |
| `lg:` (1024px) | 그리드 3열, 관리자 사이드바 노출 |

---

## 아이콘 패턴

인라인 SVG 사용 (라이브러리 없음). Heroicons 스타일.

```jsx
// 체크
<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
</svg>

// 닫기
<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
</svg>

// 삭제 (이모지 방식도 허용)
🗑️
```

---

## 주의사항

1. **이모지 사용:** 버튼 아이콘 등 일부에서 이모지 직접 사용 허용 (🗑️ ✕ 등)
2. **폰트:** 별도 지정 없음 — 시스템 기본 sans-serif (Tailwind 기본)
3. **다크모드:** 미지원. `dark:` 클래스 추가 금지
4. **이미지 최적화:** `next/image` 대신 일반 `<img>` 사용 중 (로고, 썸네일 등)
5. **Tailwind v4:** `tailwind.config.ts` 없음. CSS에서 `@import "tailwindcss"` 방식
