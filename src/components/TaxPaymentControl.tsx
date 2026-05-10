'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Method = 'online' | 'cash' | 'cash_paid' | null

const OPTIONS: { value: Method; label: string; color: string }[] = [
  { value: 'online',    label: '💳 Pagado online',       color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' },
  { value: 'cash_paid', label: '💵 Cobrado en efectivo',  color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' },
  { value: 'cash',      label: '⏳ Pendiente (efectivo)', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
]

export default function TaxPaymentControl({
  reservationId,
  current,
}: {
  reservationId: string
  current: Method
}) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function setStatus(value: Method) {
    setOpen(false)
    setLoading(true)
    await fetch('/api/mossos/checkin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId, taxPaymentMethod: value }),
    })
    setLoading(false)
    router.refresh()
  }

  const currentOption = OPTIONS.find(o => o.value === current)

  return (
    <div className="mt-2 relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className="w-full text-xs font-medium px-3 py-2 rounded-lg border bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-50 flex items-center justify-between"
      >
        <span>{loading ? 'Guardando…' : (currentOption?.label ?? '— Sin estado —')}</span>
        <span className="text-slate-400">▾</span>
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={`w-full text-left text-xs font-medium px-3 py-2 border-b last:border-0 border-slate-100 ${opt.color} transition-colors`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
