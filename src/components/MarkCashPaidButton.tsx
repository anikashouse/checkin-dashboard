'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MarkCashPaidButton({ reservationId }: { reservationId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleClick() {
    if (!confirm('¿Confirmas que has cobrado la tasa turística en efectivo?')) return
    setLoading(true)
    const res = await fetch('/api/mossos/checkin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId }),
    })
    setLoading(false)
    if (res.ok) router.refresh()
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="mt-2 w-full text-xs font-medium px-3 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50"
    >
      {loading ? 'Guardando…' : '✓ Marcar como cobrado en efectivo'}
    </button>
  )
}
