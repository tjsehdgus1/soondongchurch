'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const MAX_BYTES = 204800 // 200KB

function compressImage(file: File | Blob, maxDim = 1920, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new globalThis.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        } else {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => { if (blob) resolve(blob); else reject(new Error('압축 실패')) },
        'image/jpeg',
        quality,
      )
    }
    img.onerror = reject
    img.src = url
  })
}

interface TiptapEditorProps {
  content: string
  onChange: (html: string) => void
  onSizeError?: (exceeded: boolean) => void
}

export default function TiptapEditor({ content, onChange, onSizeError }: TiptapEditorProps) {
  const [uploading, setUploading] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none min-h-[280px] px-4 py-3 focus:outline-none',
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items
        if (!items) return false

        for (const item of Array.from(items)) {
          if (!item.type.startsWith('image/')) continue

          event.preventDefault()
          const file = item.getAsFile()
          if (!file) continue

          setUploading(true)
          ;(async () => {
            try {
              const supabase = createClient()
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) { alert('로그인이 필요합니다.'); return }

              const blob = await compressImage(file)
              const path = `${user.id}/${Date.now()}.jpg`
              const { error: uploadError } = await supabase.storage
                .from('group-images')
                .upload(path, blob, { contentType: 'image/jpeg' })

              if (uploadError) {
                alert('이미지 업로드 실패: ' + uploadError.message)
                return
              }

              const { data: urlData } = supabase.storage.from('group-images').getPublicUrl(path)
              view.dispatch(
                view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.paragraph.create()
                )
              )
              editor?.chain().focus().setImage({ src: urlData.publicUrl }).run()
            } catch (e: unknown) {
              alert('이미지 처리 오류: ' + (e instanceof Error ? e.message : String(e)))
            } finally {
              setUploading(false)
            }
          })()

          return true
        }
        return false
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML()
      const byteSize = new Blob([html]).size
      onSizeError?.(byteSize > MAX_BYTES)
      onChange(html)
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
      {/* 툴바 */}
      <div className="flex flex-wrap gap-1 px-3 py-2.5 border-b border-gray-100 bg-gray-50">
        <ToolBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="굵게">
          <b>B</b>
        </ToolBtn>
        <ToolBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="기울임">
          <i>I</i>
        </ToolBtn>
        <ToolBtn onClick={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive('strike')} title="취소선">
          <s>S</s>
        </ToolBtn>
        <div className="w-px bg-gray-200 mx-1 self-stretch" />
        <ToolBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} title="제목">
          H2
        </ToolBtn>
        <ToolBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })} title="소제목">
          H3
        </ToolBtn>
        <div className="w-px bg-gray-200 mx-1 self-stretch" />
        <ToolBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="글머리 목록">
          ≡
        </ToolBtn>
        <ToolBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="번호 목록">
          1.
        </ToolBtn>
        <ToolBtn onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} title="인용">
          "
        </ToolBtn>
        <div className="w-px bg-gray-200 mx-1 self-stretch" />
        <ToolBtn onClick={() => editor?.chain().focus().undo().run()} title="실행 취소">↩</ToolBtn>
        <ToolBtn onClick={() => editor?.chain().focus().redo().run()} title="다시 실행">↪</ToolBtn>

        {uploading && (
          <span className="ml-auto text-sm text-indigo-500 self-center animate-pulse">
            이미지 업로드 중...
          </span>
        )}
      </div>

      {/* 에디터 본문 */}
      <EditorContent editor={editor} className="bg-white text-sm text-gray-800" />

      {/* 힌트 */}
      <div className="px-4 py-1.5 bg-gray-50 border-t border-gray-100">
        <p className="text-sm text-gray-400">이미지를 복사한 뒤 에디터에 붙여넣기(Ctrl+V)하면 자동으로 업로드됩니다.</p>
      </div>
    </div>
  )
}

function ToolBtn({
  onClick, active, title, children,
}: {
  onClick?: () => void
  active?: boolean
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2.5 py-1.5 rounded text-base font-medium transition-colors ${
        active ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      }`}
    >
      {children}
    </button>
  )
}
