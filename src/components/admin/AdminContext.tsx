'use client'

import { createContext, useContext, type ReactNode } from 'react'

// 관리자 로그인 여부 (화면 표시용 — 실제 권한은 관리자 API·RLS가 검사)
const AdminContext = createContext(false)

export function AdminProvider({ isAdmin, children }: { isAdmin: boolean, children: ReactNode }) {
    return <AdminContext value={isAdmin}>{children}</AdminContext>
}

export function useIsAdmin(): boolean {
    return useContext(AdminContext)
}
