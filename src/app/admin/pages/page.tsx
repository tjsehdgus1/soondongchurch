'use client'

import AdminRecordEditor from '@/components/admin/AdminRecordEditor'

// key 앞부분 → 화면 이름
const PAGE_LABEL: Record<string, string> = {
  home: '홈', about: '교회소개', worship: '예배 안내', nextgen: '다음세대',
  mission: '선교', fellowship: '전도회', discipleship: '양육', directions: '오시는 길',
}

export default function AdminPageBlocksPage() {
  return (
    <AdminRecordEditor
      title="페이지 문구"
      description="각 페이지의 제목·부제·본문·사진입니다. 본문은 <p>, <strong>, <br> 같은 간단한 HTML을 쓸 수 있습니다."
      endpoint="/api/admin/page-blocks"
      idColumn="key"
      headerOf={(r) => `${PAGE_LABEL[String(r.key).split('.')[0]] ?? ''} · ${r.key}`}
      matches={(r, q) => `${r.key} ${r.title ?? ''} ${r.body ?? ''}`.includes(q)}
      newDefaults={{ key: '', title: '', subtitle: '', body: '', image_url: null }}
      columns={[
        { name: 'title', label: '제목', type: 'text', wide: true },
        { name: 'subtitle', label: '부제', type: 'text', wide: true },
        { name: 'body', label: '본문 (HTML)', type: 'textarea' },
        { name: 'image_url', label: '대표 사진', type: 'image', uploadScope: 'pages' },
      ]}
    />
  )
}
