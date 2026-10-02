// 아이디 찾기 — 가입 때 입력한 이름·휴대폰 번호로 찾고, 아이디는 일부만 가려서 보여 줌
// tests/find-id.test.ts

// 숫자만 남김 (010-1234-5678 = 01012345678)
export function phoneDigits(phone: string): string {
    return phone.replace(/\D/g, '')
}

// 앞 2글자·마지막 1글자는 보이고 가운데는 * (최소 1글자 가림)
export function maskUsername(username: string): string {
    if (username.length <= 2) return username[0] + '*'.repeat(username.length - 1)
    const head = Math.min(2, username.length - 2)
    return username.slice(0, head) + '*'.repeat(username.length - head - 1) + username.slice(-1)
}

export function matchUsernames(
    profiles: { username: string, name: string, phone_number: string | null }[],
    name: string,
    phone: string,
): string[] {
    const wantName = name.trim()
    const wantPhone = phoneDigits(phone)
    if (!wantName || wantPhone.length < 10) return []
    return profiles
        .filter((p) => p.name.trim() === wantName && phoneDigits(p.phone_number ?? '') === wantPhone)
        .map((p) => maskUsername(p.username))
}
