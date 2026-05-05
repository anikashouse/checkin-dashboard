import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getReservations } from '@/lib/db'
import Calendar from '@/components/Calendar'
import EditPropertyForm from '@/components/EditPropertyForm'
import DeletePropertyButton from '@/components/DeletePropertyButton'

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) redirect('/auth/signin')

  const { data: properties } = await supabase.from('properties').select('*').eq('user_id', userId)
  if (!properties || properties.length === 0) redirect('/setup')

  const property = properties.find(p => p.id === id)
  if (!property) redirect('/dashboard')

  const reservations = await getReservations(id)
  const now = new Date()

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{property.name}</h1>
          {property.address && <p className="text-teal-600 text-sm mt-1">{property.address}</p>}
          <p className="text-slate-400 text-sm mt-1">{reservations.length} reservas</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <EditPropertyForm property={property} />
          <DeletePropertyButton propertyId={property.id} propertyName={property.name} />
        </div>
      </div>

      {/* Calendar */}
      <div className="mb-8">
        <Calendar
          reservations={reservations}
          properties={properties as any}
          year={now.getFullYear()}
          month={now.getMonth()}
        />
      </div>

      {/* Reservations list */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Reservas
        </h2>
        {reservations.length > 0 ? (
          <div>
            {reservations.map(res => {
              const isReserved = !res.guestName || res.guestName.toLowerCase() === 'reserved'
              const name = res.checkinStatus?.guestSurname
                ?? (isReserved ? res.airbnbCode : res.guestName!.trim().split(' ').at(-1)!)
              const isPast = new Date(res.checkOut) < now
              return (
                <Link
                  key={res.id}
                  href={`/dashboard/${id}/${res.id}`}
                  className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div>
                      <span className={`font-semibold text-sm ${isPast ? 'text-slate-400' : 'text-slate-900'}`}>
                        {name}
                      </span>
                      <span className="text-slate-400 text-xs mx-2">·</span>
                      <span className="text-xs text-slate-400">{res.airbnbCode}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex gap-1">
                      <span className={`w-2 h-2 rounded-full ${res.checkinStatus?.formComplete ? 'bg-emerald-500' : 'bg-slate-300'}`} title="Formulario" />
                      <span className={`w-2 h-2 rounded-full ${res.checkinStatus?.txtGenerated ? 'bg-emerald-500' : 'bg-slate-300'}`} title=".txt" />
                      <span className={`w-2 h-2 rounded-full ${res.checkinStatus?.mossosSent ? 'bg-emerald-500' : 'bg-slate-300'}`} title="Mossos" />
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(res.checkIn).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      <span className="mx-1">→</span>
                      {new Date(res.checkOut).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400 py-4 text-center">Sin reservas</p>
        )}
      </div>
    </div>
  )
}
