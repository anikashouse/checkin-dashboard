import Link from 'next/link'
import type { Property, Reservation } from '@/lib/types'

const FALLBACK_COLORS = ['#C8A96E','#6395D2','#5AB98C','#D26E9B','#9B78D2']

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
  const hex = property.coverColor ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]

  const nextLabel = nextReservation
    ? new Date(nextReservation.checkIn).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    : null

  return (
    <Link href={`/dashboard/${property.id}`} className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: hex + '22' }}>
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: hex }} />
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
