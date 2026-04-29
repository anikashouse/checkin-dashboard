'use client'

import { useMemo } from 'react'
import type { Reservation } from '@/lib/types'

interface CalendarProps {
  reservations: Reservation[]
  year: number
  month: number
}

const COLORS = {
  yellow: 'bg-yellow-100 border-yellow-300',
  blue: 'bg-blue-100 border-blue-300',
  green: 'bg-green-100 border-green-300',
  pink: 'bg-pink-100 border-pink-300',
  purple: 'bg-purple-100 border-purple-300',
}

const colorArray = Object.values(COLORS)

export default function Calendar({ reservations, year, month }: CalendarProps) {
  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate()
  const firstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay()

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const totalDays = daysInMonth(year, month)
  const firstDay = firstDayOfMonth(year, month)
  const dayArray = Array.from({ length: totalDays }, (_, i) => i + 1)
  const leadingNulls = Array(firstDay).fill(null)
  const totalCells = Math.ceil((firstDay + totalDays) / 7) * 7
  const trailingNulls = Array(totalCells - firstDay - totalDays).fill(null)
  const calendarDays = leadingNulls.concat(dayArray).concat(trailingNulls)

  // Get reservations that overlap with this month
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)

  const relevantReservations = useMemo(() => {
    if (!reservations || !Array.isArray(reservations)) return []
    return reservations.filter(res => {
      const checkOut = new Date(res.checkOut)
      const checkIn = new Date(res.checkIn)
      return checkOut > monthStart && checkIn <= monthEnd
    })
  }, [reservations, year, month])

  const getReservationColor = (index: number) => colorArray[index % colorArray.length]

  // Create a map of day -> reservations for that day
  const dayReservations = useMemo(() => {
    const map: Record<number, Array<{ res: Reservation; colorClass: string; index: number }>> = {}

    relevantReservations.forEach((res, resIndex) => {
      const checkIn = new Date(res.checkIn)
      const checkOut = new Date(res.checkOut)

      // Find all days this reservation spans in the current month
      let currentDate = new Date(Math.max(checkIn.getTime(), monthStart.getTime()))
      currentDate.setHours(0, 0, 0, 0)

      while (currentDate < checkOut && currentDate <= monthEnd) {
        const dayOfMonth = currentDate.getDate()
        if (!map[dayOfMonth]) map[dayOfMonth] = []
        map[dayOfMonth].push({
          res,
          colorClass: getReservationColor(resIndex),
          index: resIndex
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }
    })

    return map
  }, [relevantReservations, year, month])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        {monthNames[month]} De {year}
      </h2>

      <div className="border border-gray-300 rounded-lg overflow-hidden">
        {/* Header with day names */}
        <div className="grid grid-cols-7 gap-0 bg-gray-50 border-b border-gray-300">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
            <div key={day} className="border-r border-gray-300 p-3 text-center font-bold text-slate-700 text-sm h-12 flex items-center justify-center">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0 bg-white">
          {calendarDays.map((day, idx) => (
            <div
              key={idx}
              className="border-r border-b border-gray-300 p-2 min-h-28"
              style={{
                borderRight: idx % 7 === 6 ? 'none' : undefined,
              }}
            >
              {day ? (
                <div className="h-full">
                  <div className="font-bold text-slate-700 mb-2 text-sm">{day}</div>
                  <div className="space-y-1">
                    {dayReservations[day]?.map((item, resIdx) => (
                      <div
                        key={`${item.res.id}-${resIdx}`}
                        className={`text-xs p-2 rounded border ${item.colorClass} border-l-4`}
                      >
                        <div className="font-medium text-slate-900 truncate">
                          {item.res.airbnbCode || item.res.guestName?.split(' ')[0] || 'Guest'}
                        </div>
                        {item.res.guestName && item.res.airbnbCode && (
                          <div className="text-xs text-slate-600 truncate mt-0.5">
                            {item.res.guestName}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
