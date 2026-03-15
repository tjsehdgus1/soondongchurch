import { createClient } from '@/lib/supabase/server'

export const revalidate = 0 // 항상 최신 데이터 불러오기

export default async function AdminMembersPage() {
  const supabase = await createClient()

  const { data: members, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-4 text-red-500 text-center">교인 목록을 불러오지 못했습니다.</div>
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">교인 관리</h1>
          <p className="mt-1 text-gray-500">웹사이트에 가입된 신도 목록을 조회합니다.</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-semibold border border-blue-100">
          총 {members?.length || 0} 명
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">이름</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">이메일</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">휴대폰 번호</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">권한</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">가입일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members?.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {member.name.charAt(0)}
                      </div>
                      {member.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {member.email}
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">
                    {member.phone_number || <span className="text-gray-400 text-sm">미등록</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                      ${member.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-green-100 text-green-700'
                      }`}>
                      {member.role === 'admin' ? '관리자' : '일반 교인'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(member.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
              {(!members || members.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    등록된 교인이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
