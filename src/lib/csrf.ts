/**
 * CSRF 방어: 요청의 Origin 헤더가 서버 Host와 일치하는지 검증
 * - 브라우저는 cross-origin POST 요청 시 Origin 헤더를 자동으로 포함
 * - 피싱 사이트에서 API를 호출하면 Origin이 다르므로 차단됨
 * - GET 요청(읽기 전용)은 검증 불필요
 */
export function checkCsrf(req: Request): boolean {
    const origin = req.headers.get('origin')
    const host = req.headers.get('host')

    // Origin 또는 Host 헤더 없으면 거부
    if (!origin || !host) return false

    try {
        return new URL(origin).host === host
    } catch {
        return false
    }
}
