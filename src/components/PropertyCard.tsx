import Link from 'next/link'
import type { Property, Reservation } from '@/lib/types'

const DOT_COLORS = ['bg-yellow-400','bg-blue-400','bg-green-400','bg-pink-400','bg-purple-400']
const DOT_BG     = ['bg-yellow-50', 'bg-blue-50',  'bg-green-50', 'bg-pink-50', 'bg-purple-50']

interface PropertyCardProps {
  property: Property
  reservations: Reservation[]
  index: number
}

export default function PropertyCard({ property, reservations, index }: PropertyCardProps) {
  const propReservations = reservations.filter(r => r.propertyId === property.id)
  const now = new Date()

  const nextReservation = propReservations
    .filter(r => new Date(r.checkIn) >= now)
    .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())[0]

  const pending = propReservations.filter(r => new Date(r.checkOut) >= now).length
  const dotColor = DOT_COLORS[index % DOT_COLORS.length]
  const dotBg    = DOT_BG[index % DOT_BG.length]

  const nextLabel = nextReservation
    ? new Date(nextReservation.checkIn).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    : null

  return (
    <Link href={`/dashboard/${property.id}`} className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-lg ${dotBg} flex items-center justify-center shrink-0`}>
            <span className={`w-3 h-3 rounded-full ${dotColor}`} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 leading-tight">{property.name}</h3>
            {property.address && (
              <p className="text-sm text-teal-600 mt-0.5 truncate">{property.address}</p>
            )}
            {nextLabel && (
              <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-full text-xs font-medium">
                + {nextLabel}
              </span>
            )}
            {!nextLabel && propReservations.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">Sin reservas</p>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-slate-900">{pending}</div>
          <div className="text-xs text-slate-400">pendientes</div>
        </div>
      </div>
    </Link>
  )
}
