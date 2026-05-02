'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Reservation, Property } from '@/lib/types'

interface CalendarProps {
  reservations: Reservation[]
  properties?: Property[]
  year: number
  month: number
}

// RGB values so we can use them in rgba() backgrounds and solid borders
const BLOCK_COLORS = [
  { r: 200, g: 169, b: 110 },
  { r:  99, g: 149, b: 210 },
  { r:  90, g: 185, b: 140 },
  { r: 210, g: 110, b: 155 },
  { r: 155, g: 120, b: 210 },
]

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

const monthNames = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]
const dayLabels = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

type RGB = { r: number; g: number; b: number }
// urgency: 'done' | 'normal' | 'soon' | 'active' | 'overdue'
type BlockItem = {
  res: Reservation
  color: RGB
  isStart: boolean
  isEnd: boolean
  isPast: boolean
  urgency: 'done' | 'normal' | 'soon' | 'active' | 'overdue'
}

function getUrgency(res: Reservation, todayStr: string): BlockItem['urgency'] {
  const filled = res.checkinStatus?.formComplete ?? false
  const sent   = res.checkinStatus?.mossosSent ?? false
  const ci = res.checkIn
  const co = res.checkOut

  if (co <= todayStr && sent)  return 'done'    // past + all green → dim
  if (co <= todayStr && !sent) return 'overdue' // past + missing files → red
  if (ci <= todayStr)          return filled ? 'normal' : 'active'  // currently staying
  // future: check-in within 3 days
  const daysUntil = (new Date(ci).getTime() - new Date(todayStr).getTime()) / 86400000
  if (daysUntil <= 3 && !filled) return 'soon'
  return 'normal'
}

const URGENCY_STYLES: Record<BlockItem['urgency'], {
  bg: string; border: string; text: string; pulse?: boolean
}> = {
  done:    { bg: '0.055', border: '0.35', text: 'text-slate-400' },
  normal:  { bg: '0.125', border: '1',    text: 'text-slate-900' },
  soon:    { bg: 'amber', border: 'amber', text: 'text-amber-800' },
  active:  { bg: 'red',   border: 'red',   text: 'text-red-800', pulse: true },
  overdue: { bg: 'red',   border: 'red',   text: 'text-red-700' },
}

function StatusDot({ green, tooltip }: { green: boolean; tooltip: string }) {
  return (
    <div className="group relative">
      <div className={`w-1.5 h-1.5 rounded-full cursor-help ${green ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {tooltip}
      </div>
    </div>
  )
}

function ReservationBlock({ item }: { item: BlockItem }) {
  const { r, g, b } = item.color
  const code    = item.res.airbnbCode || item.res.guestName || 'Guest'
  const surname = item.res.checkinStatus?.guestSurname
  const u       = item.urgency

  // Property colour blocks for done/normal; fixed colours for urgent states
  const bgStyle   = u === 'done'    ? `rgba(${r},${g},${b},0.055)`
                  : u === 'soon'    ? 'rgba(251,191,36,0.18)'
                  : u === 'active'  ? 'rgba(239,68,68,0.12)'
                  : u === 'overdue' ? 'rgba(239,68,68,0.10)'
                  :                   `rgba(${r},${g},${b},0.125)`

  const borderRgb = u === 'soon'    ? '251,146,60'
                  : u === 'active'  ? '239,68,68'
                  : u === 'overdue' ? '220,38,38'
                  :                   `${r},${g},${b}`

  const borderAlpha = u === 'done' ? '0.35' : '1'

  return (
    <Link
      href={`/dashboard/${item.res.propertyId}/${item.res.id}`}
      className={`block text-xs rounded px-1 py-0.5 rounded-r-none hover:brightness-95 transition-[filter] ${u === 'active' ? 'ring-1 ring-red-400 ring-inset' : ''}`}
      style={{
        backgroundColor: bgStyle,
        borderLeft:  item.isStart ? `2px solid rgba(${borderRgb},${borderAlpha})` : '2px solid transparent',
        borderRight: item.isEnd   ? `2px solid rgba(${borderRgb},${borderAlpha})` : undefined,
      }}
    >
      <div className={`font-semibold truncate text-xs ${URGENCY_STYLES[u].text}`}>
        {u === 'active'  && '⚠ '}
        {u === 'soon'    && '⏰ '}
        {u === 'overdue' && '⚡ '}
        {code}{surname ? ` · ${surname}` : ''}
      </div>
      <div className="flex gap-0.5 mt-0.5">
        <StatusDot green={item.res.checkinStatus?.formComplete ?? false} tooltip={item.res.checkinStatus?.formComplete ? '✓ Formulario' : '○ Sin formulario'} />
        <StatusDot green={item.res.checkinStatus?.txtGenerated ?? false} tooltip={item.res.checkinStatus?.txtGenerated ? '✓ .txt generado' : '○ Sin .txt'} />
        <StatusDot green={item.res.checkinStatus?.mossosSent ?? false} tooltip={item.res.checkinStatus?.mossosSent ? '✓ Enviado a Mossos' : '○ Sin comprobante'} />
      </div>
    </Link>
  )
}

export default function Calendar({ reservations, properties, year, month }: CalendarProps) {
  const [view, setView] = useState<'month' | 'week'>('month')
  const [displayYear, setDisplayYear] = useState(year)
  const [displayMonth, setDisplayMonth] = useState(month)
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const today = new Date()
    const day = (today.getDay() + 6) % 7
    const d = new Date(today)
    d.setDate(today.getDate() - day)
    d.setHours(0, 0, 0, 0)
    return d
  })

  const todayStr = toDateStr(new Date())

  const colorByProperty = useMemo(() => {
    const map: Record<string, RGB> = {}
    if (properties && properties.length > 0) {
      properties.forEach((p, idx) => {
        map[p.id] = p.coverColor ? hexToRgb(p.coverColor) : BLOCK_COLORS[idx % BLOCK_COLORS.length]
      })
    }
    return map
  }, [properties])

  // ── Month ────────────────────────────────────────────────────
  const monthStart     = new Date(displayYear, displayMonth, 1)
  const monthEnd       = new Date(displayYear, displayMonth + 1, 0)
  const daysInMonth    = monthEnd.getDate()
  const firstDayOfWeek = (monthStart.getDay() + 6) % 7
  const totalCells     = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7
  const calendarDays: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...Array(totalCells - firstDayOfWeek - daysInMonth).fill(null),
  ]

  const relevantReservations = useMemo(() => {
    if (!reservations || !Array.isArray(reservations)) return []
    return reservations.filter(res => {
      const ci = parseLocalDate(res.checkIn)
      const co = parseLocalDate(res.checkOut)
      return co > monthStart && ci <= monthEnd
    })
  }, [reservations, displayYear, displayMonth])

  const dayMap = useMemo(() => {
    const map: Record<number, BlockItem[]> = {}
    relevantReservations.forEach((res, idx) => {
      const color = colorByProperty[res.propertyId] ?? BLOCK_COLORS[idx % BLOCK_COLORS.length]
      const checkIn  = parseLocalDate(res.checkIn)
      const checkOut = parseLocalDate(res.checkOut)
      const urgency = getUrgency(res, todayStr)
      const isPast  = urgency === 'done'
      const lastNight = new Date(checkOut)
      lastNight.setDate(lastNight.getDate() - 1)
      let cur = new Date(Math.max(checkIn.getTime(), monthStart.getTime()))
      cur.setHours(0, 0, 0, 0)
      while (cur < checkOut && cur <= monthEnd) {
        const d = cur.getDate()
        if (!map[d]) map[d] = []
        map[d].push({ res, color, isPast, urgency, isStart: toDateStr(cur) === res.checkIn, isEnd: toDateStr(cur) === toDateStr(lastNight) })
        cur = new Date(cur)
        cur.setDate(cur.getDate() + 1)
      }
    })
    return map
  }, [relevantReservations, displayYear, displayMonth])

  // ── Week ─────────────────────────────────────────────────────
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + 6); return d
  }, [weekStart])

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d
    }), [weekStart])

  const weekDayMap = useMemo(() => {
    const map: Record<string, BlockItem[]> = {}
    if (!reservations || !Array.isArray(reservations)) return map
    reservations.forEach((res, idx) => {
      const color = colorByProperty[res.propertyId] ?? BLOCK_COLORS[idx % BLOCK_COLORS.length]
      const checkIn  = parseLocalDate(res.checkIn)
      const checkOut = parseLocalDate(res.checkOut)
      const urgency = getUrgency(res, todayStr)
      const isPast  = urgency === 'done'
      const lastNight = new Date(checkOut); lastNight.setDate(lastNight.getDate() - 1)
      weekDays.forEach(day => {
        if (day >= checkIn && day < checkOut) {
          const dayStr = toDateStr(day)
          if (!map[dayStr]) map[dayStr] = []
          map[dayStr].push({ res, color, isPast, urgency, isStart: dayStr === res.checkIn, isEnd: dayStr === toDateStr(lastNight) })
        }
      })
    })
    return map
  }, [reservations, weekDays, colorByProperty])

  const weekLabel = (() => {
    const s = weekDays[0], e = weekDays[6]
    const sm = monthNames[s.getMonth()].slice(0, 3)
    const em = monthNames[e.getMonth()].slice(0, 3)
    return s.getMonth() === e.getMonth()
      ? `${s.getDate()} — ${e.getDate()} ${em} ${e.getFullYear()}`
      : `${s.getDate()} ${sm} — ${e.getDate()} ${em} ${e.getFullYear()}`
  })()

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-slate-900">
            {view === 'month' ? `${monthNames[displayMonth]} de ${displayYear}` : weekLabel}
          </h2>
          <div className="flex items-center gap-1">
            {(['month', 'week'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  view === v ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-gray-100'
                }`}
              >
                {v === 'month' ? 'Mes' : 'Semana'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (view === 'week') {
                setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
              } else {
                setDisplayMonth(m => { if (m === 0) { setDisplayYear(y => y - 1); return 11 } return m - 1 })
              }
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => {
              const today = new Date()
              if (view === 'week') {
                const day = (today.getDay() + 6) % 7
                const d = new Date(today); d.setDate(today.getDate() - day); d.setHours(0,0,0,0)
                setWeekStart(d)
              } else {
                setDisplayYear(today.getFullYear())
                setDisplayMonth(today.getMonth())
              }
            }}
            className="px-2.5 py-1 text-xs font-medium text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={() => {
              if (view === 'week') {
                setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })
              } else {
                setDisplayMonth(m => { if (m === 11) { setDisplayYear(y => y + 1); return 0 } return m + 1 })
              }
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {dayLabels.map(d => (
          <div key={d} className="text-center text-xs font-medium text-slate-400 py-1.5 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Month grid */}
      {view === 'month' && (
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            const dayStr  = day ? `${displayYear}-${String(displayMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` : ''
            const isToday = dayStr === todayStr
            const items   = day ? (dayMap[day] || []) : []
            return (
              <div
                key={idx}
                className={`p-1.5 rounded-lg border min-h-24 flex flex-col ${
                  !day
                    ? 'bg-gray-50/50 border-slate-100'
                    : isToday
                      ? 'bg-amber-50 border-2 border-amber-400'
                      : 'bg-white border-slate-100'
                }`}
              >
                {day && (
                  <>
                    <div className={`text-xs font-bold mb-1 ${isToday ? 'text-orange-500' : 'text-slate-900'}`}>
                      {day}
                    </div>
                    <div className="flex-1 space-y-0.5 overflow-hidden">
                      {items.map((item, i) => <ReservationBlock key={`${item.res.id}-${i}`} item={item} />)}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Week grid */}
      {view === 'week' && (
        <>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekDays.map((day, i) => {
              const isToday = toDateStr(day) === todayStr
              return (
                <div key={i} className={`text-center py-2 rounded-lg ${isToday ? 'bg-orange-50' : ''}`}>
                  <div className={`text-lg font-bold ${isToday ? 'text-orange-500' : 'text-slate-800'}`}>{day.getDate()}</div>
                  <div className="text-xs text-slate-400">{monthNames[day.getMonth()].slice(0,3)}</div>
                </div>
              )
            })}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day, i) => {
              const dayStr = toDateStr(day)
              const isToday = dayStr === todayStr
              const items = weekDayMap[dayStr] || []
              return (
                <div key={i} className={`p-1.5 rounded-lg border min-h-32 flex flex-col ${isToday ? 'bg-orange-50/40 border-orange-200' : 'bg-white border-slate-100'}`}>
                  <div className="flex-1 space-y-0.5 overflow-hidden">
                    {items.map((item, j) => <ReservationBlock key={`${item.res.id}-${j}`} item={item} />)}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
