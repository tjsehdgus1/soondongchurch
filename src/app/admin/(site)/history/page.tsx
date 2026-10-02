'use client'

import AdminRecordEditor from '@/components/admin/AdminRecordEditor'

export default function AdminHistoryPage() {
  return (
    <AdminRecordEditor
      title="연혁"
      description="'걸어온 길' 페이지에 연도순으로 표시됩니다. 같은 해 안에서는 순서 숫자가 작은 항목이 먼저 나옵니다."
      endpoint="/api/admin/timeline"
      idColumn="id"
      headerOf={(r) => `${r.year}${r.date_label ? `. ${r.date_label}` : ''} — ${String(r.title).slice(0, 40)}`}
      matches={(r, q) => `${r.year} ${r.title} ${r.description ?? ''}`.includes(q)}
      newDefaults={{ year: new Date().getFullYear(), date_label: '', title: '', description: '', image_url: null, sort_order: 999 }}
      columns={[
        { name: 'year', label: '연도', type: 'int' },
        { name: 'date_label', label: '날짜 (예: 7. 15)', type: 'text' },
        { name: 'sort_order', label: '순서', type: 'int' },
        { name: 'image_url', label: '사진 (선택)', type: 'image', uploadScope: 'timeline' },
        { name: 'title', label: '내용', type: 'text', wide: true },
        { name: 'description', label: '추가 설명', type: 'textarea' },
      ]}
    />
  )
}
