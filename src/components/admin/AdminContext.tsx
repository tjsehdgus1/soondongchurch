'use client'

import { createContext, useContext, type ReactNode } from 'react'

// 관리자 로그인 여부·사이트 설정 권한 (화면 표시용 — 실제 권한은 관리자 API·RLS가 검사)
type AdminState = { isAdmin: boolean, canManageSite: boolean }
const AdminContext = createContext<AdminState>({ isAdmin: false, canManageSite: false })

export function AdminProvider({ isAdmin, canManageSite, children }: AdminState & { children: ReactNode }) {
    return <AdminContext value={{ isAdmin, canManageSite }}>{children}</AdminContext>
}

export function useIsAdmin(): boolean {
    return useContext(AdminContext).isAdmin
}

export function useCanManageSite(): boolean {
    return useContext(AdminContext).canManageSite
}
