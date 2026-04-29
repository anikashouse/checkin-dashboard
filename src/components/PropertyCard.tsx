import type { Property, Reservation } from '@/lib/types'

interface PropertyCardProps {
  property: Property
  reservations: Reservation[]
  index: number
}

const PROPERTY_ICONS = ['🏡', '🏠', '🏘️', '🏢', '🏗️']

export default function PropertyCard({ property, reservations, index }: PropertyCardProps) {
  const icon = PROPERTY_ICONS[index % PROPERTY_ICONS.length]
  const propertyReservations = reservations.filter(r => (r as any).property_id === property.id)

  const now = new Date()
  const nextReservation = propertyReservations
    .filter(r => new Date(r.checkIn) >= now)
    .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())[0]

  const daysUntilNext = nextReservation
    ? Math.ceil((new Date(nextReservation.checkIn).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex gap-4">
      <div className="flex-shrink-0">
        <div className="text-4xl">{icon}</div>
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-slate-900">{property.name}</h3>
        {property.address && (
          <p className="text-sm text-slate-500">{property.address}</p>
        )}
        <div className="mt-2">
          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-900 rounded text-xs font-medium">
            {propertyReservations.length} reservas
          </span>
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="text-2xl font-bold text-slate-900">{index + 1}</div>
        {nextReservation && daysUntilNext !== null && (
          <div className="mt-2 inline-block px-2 py-1 bg-orange-500 text-white rounded text-xs font-medium whitespace-nowrap">
            ⏱️ Próximo: {daysUntilNext}d
          </div>
        )}
      </div>
    </div>
  )
}
