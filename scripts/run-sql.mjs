// supabase/*.sql 파일을 Management API로 실행 (대시보드 SQL Editor 대신)
// 실행: node --env-file=.env.local scripts/run-sql.mjs supabase/파일.sql
import { readFileSync } from 'node:fs'

const file = process.argv[2]
if (!file) {
    console.error('사용법: node --env-file=.env.local scripts/run-sql.mjs <sql 파일>')
    process.exit(1)
}
const token = process.env.SUPABASE_ACCESS_TOKEN
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!token || !url) {
    console.error('SUPABASE_ACCESS_TOKEN, NEXT_PUBLIC_SUPABASE_URL 환경변수가 필요합니다.')
    process.exit(1)
}
const ref = new URL(url).hostname.split('.')[0]

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: readFileSync(file, 'utf8') }),
})
const text = await res.text()
if (!res.ok) {
    console.error(`실패 (${res.status}):`, text.slice(0, 1000))
    process.exit(1)
}
console.log(`✓ ${file} 실행 완료`)
