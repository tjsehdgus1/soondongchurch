import { test } from 'node:test'
import assert from 'node:assert/strict'
import { splitGallery } from '../src/lib/gallery.ts'

test('pulls figure images out and keeps the text', () => {
    const html = '<p>예배드리고 건축 합니다.</p>\n<figure><img src="/a.webp" width="1210" height="907" alt=""></figure>\n<figure><img src="/b.webp" width="907" height="1613" alt="둘째"></figure>'
    const result = splitGallery(html)
    assert.ok(result)
    assert.deepEqual(result.images, [
        { src: '/a.webp', alt: '', width: 1210, height: 907 },
        { src: '/b.webp', alt: '둘째', width: 907, height: 1613 },
    ])
    assert.equal(result.rest, '<p>예배드리고 건축 합니다.</p>')
})

test('bare img tags and empty paragraphs are removed too', () => {
    const html = '<p><img src="/a.webp"></p><p><img src="/b.webp" alt="x"></p><p>본문</p><p><br></p>'
    const result = splitGallery(html)
    assert.ok(result)
    assert.equal(result.images.length, 2)
    assert.equal(result.images[0].width, undefined)
    assert.equal(result.rest, '<p>본문</p>')
})

test('fewer than two images is not a gallery', () => {
    assert.equal(splitGallery('<p>글</p><figure><img src="/a.webp"></figure>'), null)
    assert.equal(splitGallery('<p>글만</p>'), null)
})
