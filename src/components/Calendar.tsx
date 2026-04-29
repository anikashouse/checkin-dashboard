'use client'

import { useMemo } from 'react'
import type { Reservation } from '@/lib/types'

interface CalendarProps {
  reservations: Reservation[]
  year: number
  month: number
}

const COLORS = [
  'bg-yellow-100 border-yellow-300 text-yellow-900',
  'bg-blue-100 border-blue-300 text-blue-900',
  'bg-green-100 border-green-300 text-green-900',
  'bg-pink-100 border-pink-300 text-pink-900',
  'bg-purple-100 border-purple-300 text-purple-900',
]

export default function Calendar({ reservations, year, month }: CalendarProps) {
  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate()
  const firstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay()

  const days = useMemo(() => {
    const totalDays = daysInMonth(year, month)
    const firstDay = firstDayOfMonth(year, month)
    const weeks: (number | null)[][] = []
    let week: (number | null)[] = Array(firstDay).fill(null)

    for (let day = 1; day <= totalDays; day++) {
      week.push(day)
      if (week.length === 7) {
        weeks.push(week)
        week = []
      }
    }

    if (week.length > 0) {
      while (week.length < 7) week.push(null)
      weeks.push(week)
    }

    return weeks
  }, [year, month])

  const getReservationsForDay = (day: number) => {
    if (!reservations || !Array.isArray(reservations)) return []
    return reservations.filter(res => {
      const checkIn = new Date(res.checkIn)
      const checkOut = new Date(res.checkOut)
      const currentDay = new Date(year, month, day)
      return currentDay >= checkIn && currentDay < checkOut
    })
  }

  const getColorClass = (index: number) => COLORS[index % COLORS.length]

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-6">
        {monthNames[month]} De {year}
      </h2>

      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'].map(day => (
          <div key={day} className="bg-gray-50 p-2 text-center font-medium text-sm text-slate-600">
            {day}
          </div>
        ))}

        {days.map((week, weekIdx) =>
          week.map((day, dayIdx) => {
            const reservationsForDay = day ? getReservationsForDay(day) : []

            return (
              <div
                key={`${weekIdx}-${dayIdx}`}
                className="bg-white p-2 min-h-24 border border-gray-200 text-sm"
              >
                {day ? (
                  <>
                    <div className="font-medium text-slate-900 mb-1">{day}</div>
                    <div className="space-y-1">
                      {reservationsForDay.map((res, idx) => (
                        <div
                          key={res.id}
                          className={`text-xs p-1 rounded border truncate ${getColorClass(idx)}`}
                          title={`${res.guestName} - ${res.airbnbCode || 'N/A'}`}
                        >
                          {res.airbnbCode || res.guestName.split(' ')[0]}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="bg-gray-50" />
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
