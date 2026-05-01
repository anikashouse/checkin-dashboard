'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  reservationId: string
  hasTxt: boolean
  pdfBase64: string | null
  mossosSent: boolean
}

export default function MossosSection({ reservationId, hasTxt, pdfBase64, mossosSent }: Props) {
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Auto-refresh while waiting for Mossos confirmation
  useEffect(() => {
    if (mossosSent || !hasTxt) return
    const id = setInterval(() => router.refresh(), 15000)
    return () => clearInterval(id)
  }, [mossosSent, hasTxt, router])

  function downloadPdf(base64: string) {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'comprobante.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function sendToMossos() {
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/mossos/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setError('Enviando a Mossos vía GitHub Actions… El estado se actualizará en 1-2 minutos.')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  async function uploadPdf(file: File) {
    setUploading(true)
    setError('')
    const fd = new FormData()
    fd.append('reservationId', reservationId)
    fd.append('file', file)
    try {
      const res = await fetch('/api/mossos/upload-pdf', { method: 'POST', body: fd })
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
      {hasTxt && !mossosSent && (
        <p className="text-xs text-slate-400 w-full flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          Esperando confirmación de Mossos…
        </p>
      )}
      {pdfBase64 && (
        <button
          onClick={() => downloadPdf(pdfBase64)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Descargar comprobante
        </button>
      )}
      {hasTxt && (
        <button
          onClick={sendToMossos}
          disabled={sending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          {sending ? 'Enviando...' : mossosSent ? 'Reenviar a Mossos' : 'Enviar a Mossos'}
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
        {uploading ? 'Subiendo...' : pdfBase64 ? 'Reemplazar PDF' : 'Subir PDF manual'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadPdf(f) }}
      />
      {error && (
        <p className={`text-xs w-full ${error.startsWith('Enviando') ? 'text-orange-600' : 'text-red-600'}`}>
          {error}
        </p>
      )}
    </div>
  )
}
