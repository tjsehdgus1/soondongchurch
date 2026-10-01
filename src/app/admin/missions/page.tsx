'use client'

import AdminRecordEditor from '@/components/admin/AdminRecordEditor'

export default function AdminMissionsPage() {
  return (
    <AdminRecordEditor
      title="선교지"
      description="선교 페이지 지구본에 표시됩니다. 좌표는 지도 앱에서 위치를 길게 눌러 위도·경도를 복사해 넣으세요. 연결 게시판은 mission-trip(단기선교) 또는 mission-news(선교소식)."
      endpoint="/api/admin/missions"
      idColumn="id"
      headerOf={(r) => `${r.country}${r.region ? ` · ${r.region}` : ''}`}
      newDefaults={{ country: '', region: '', lat: '', lng: '', missionaries: '', summary: '', image_url: null, board_slug: 'mission-news', category: '', sort_order: 99 }}
      columns={[
        { name: 'country', label: '나라', type: 'text' },
        { name: 'region', label: '지역', type: 'text' },
        { name: 'lat', label: '위도', type: 'number' },
        { name: 'lng', label: '경도', type: 'number' },
        { name: 'missionaries', label: '선교사', type: 'text' },
        { name: 'board_slug', label: '연결 게시판', type: 'text' },
        { name: 'category', label: '연결 말머리 (선택)', type: 'text' },
        { name: 'sort_order', label: '순서', type: 'int' },
        { name: 'summary', label: '소개', type: 'textarea' },
        { name: 'image_url', label: '사진', type: 'image', uploadScope: 'missions' },
      ]}
    />
  )
}
