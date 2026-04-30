'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeletePropertyButton({
  propertyId,
  propertyName,
  onDeleted,
}: {
  propertyId: string
  propertyName: string
  onDeleted?: () => void
}) {
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      if (onDeleted) {
        onDeleted()
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setDeleting(false)
      setConfirm(false)
    }
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
        <span className="text-xs text-red-700 font-medium">¿Eliminar «{propertyName}» y todas sus reservas?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md disabled:opacity-50 transition-colors"
        >
          {deleting ? 'Eliminando…' : 'Confirmar'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="px-2.5 py-1 bg-white border border-gray-200 text-slate-600 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      Eliminar
    </button>
  )
}
