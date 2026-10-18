// 파비콘 세트 만들기 — 로고(세로로 긴 SVG)를 정사각형 가운데에 놓아 검색엔진·브라우저용 아이콘 생성
// 구글은 정사각형(48px 배수) 파비콘만 검색 결과에 씀 → 원본 SVG를 그대로 쓰면 기본 지구본 아이콘이 나옴
// 실행: node scripts/make-icons.mjs  (src/app/favicon.ico · icon.png · apple-icon.png 덮어씀)
import { readFileSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

const logo = readFileSync('public/images/logo.svg')
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 }
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 }

async function squareIcon(size, background, scale = 0.88) {
    const inner = Math.round(size * scale)
    const mark = await sharp(logo, { density: 300 })
        .resize(inner, inner, { fit: 'contain', background: CLEAR })
        .png().toBuffer()
    return sharp({ create: { width: size, height: size, channels: 4, background } })
        .composite([{ input: mark, gravity: 'center' }])
        .png().toBuffer()
}

// PNG를 담은 ICO (윈도우 비스타 이후·모든 현대 브라우저 지원)
function toIco(images) {
    const header = Buffer.alloc(6)
    header.writeUInt16LE(0, 0)
    header.writeUInt16LE(1, 2)
    header.writeUInt16LE(images.length, 4)
    let offset = 6 + 16 * images.length
    const entries = images.map(({ size, png }) => {
        const entry = Buffer.alloc(16)
        entry.writeUInt8(size >= 256 ? 0 : size, 0)
        entry.writeUInt8(size >= 256 ? 0 : size, 1)
        entry.writeUInt16LE(1, 4)
        entry.writeUInt16LE(32, 6)
        entry.writeUInt32LE(png.length, 8)
        entry.writeUInt32LE(offset, 12)
        offset += png.length
        return entry
    })
    return Buffer.concat([header, ...entries, ...images.map((i) => i.png)])
}

const ico = toIco(await Promise.all([16, 32, 48].map(async (size) => ({ size, png: await squareIcon(size, CLEAR, 0.94) }))))
writeFileSync('src/app/favicon.ico', ico)
writeFileSync('src/app/icon.png', await squareIcon(192, CLEAR))
// iOS 홈 화면 아이콘은 투명 배경을 검게 칠하므로 흰 배경
writeFileSync('src/app/apple-icon.png', await squareIcon(180, WHITE, 0.78))
console.log('favicon.ico', ico.length, '/ icon.png 192 / apple-icon.png 180')
