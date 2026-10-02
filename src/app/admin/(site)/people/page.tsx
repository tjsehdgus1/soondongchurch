'use client'

import AdminRecordEditor from '@/components/admin/AdminRecordEditor'

export default function AdminPeoplePage() {
  return (
    <AdminRecordEditor
      title="섬기는 분들"
      description="'회원만 보기'를 체크한 항목은 로그인한 회원에게만 보이고, 사진도 비공개 저장소에 올라갑니다. 같은 구분 이름끼리 묶여 표시됩니다."
      endpoint="/api/admin/people"
      idColumn="id"
      headerOf={(r) => `${r.category} · ${r.name}${r.members_only ? ' 🔒' : ''}`}
      matches={(r, q) => `${r.category} ${r.name} ${r.role ?? ''}`.includes(q)}
      newDefaults={{ category: '', name: '', role: '', period: '', photo_url: null, members_only: true, sort_order: 999 }}
      columns={[
        { name: 'category', label: '구분 (예: 시무장로)', type: 'text' },
        { name: 'name', label: '이름', type: 'text' },
        { name: 'role', label: '직함', type: 'text' },
        { name: 'period', label: '기간', type: 'text' },
        { name: 'sort_order', label: '순서', type: 'int' },
        { name: 'members_only', label: '회원만 보기', type: 'checkbox' },
        { name: 'photo_url', label: '사진', type: 'image', uploadScope: 'people', privateFlag: 'members_only' },
      ]}
    />
  )
}
