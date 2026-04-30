'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  reservationId: string
  txtContent: string | null
  txtFilename: string | null
}

export default function TxtSection({ reservationId, txtContent, txtFilename }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function downloadTxt() {
    if (!txtContent) return
    const blob = new Blob([txtContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = txtFilename || 'mossos.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function uploadTxt(file: File) {
    setUploading(true)
    setError('')
    const fd = new FormData()
    fd.append('reservationId', reservationId)
    fd.append('file', file)
    try {
      const res = await fetch('/api/mossos/upload-txt', { method: 'POST', body: fd })
      if (!res.ok) throw new Error((await res.json()).error)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      {txtContent && (
        <button
          onClick={downloadTxt}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Descargar .txt
        </button>
      )}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
        </svg>
        {uploading ? 'Subiendo...' : txtContent ? 'Reemplazar .txt' : 'Subir .txt'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".txt"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadTxt(f) }}
      />
      {error && <p className="text-xs text-red-600 w-full">{error}</p>}
    </div>
  )
}
