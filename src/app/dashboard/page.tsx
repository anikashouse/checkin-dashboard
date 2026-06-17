import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getReservationsByProperties } from '@/lib/db'
import { syncIcalForProperties } from '@/lib/syncIcal'
import Calendar from '@/components/Calendar'
import PropertyCard from '@/components/PropertyCard'

const DOT_COLORS = ['bg-yellow-400','bg-blue-400','bg-green-400','bg-pink-400','bg-purple-400']
const HEX_COLORS  = ['#FACC15',    '#60A5FA',    '#4ADE80',    '#F472B6',    '#C084FC']

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  const userName = session?.user?.name

  if (!userId) redirect('/auth/signin')

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('user_id', userId)

  const propertyIds = (properties || []).map(p => p.id)

  // Auto-sync iCal on every dashboard visit so new reservations appear immediately
  if (propertyIds.length > 0) await syncIcalForProperties(propertyIds)

  const reservations = propertyIds.length > 0 ? await getReservationsByProperties(propertyIds) : []

  const now = new Date()
  const pending = reservations.filter(r => new Date(r.checkOut) >= now).length

  // Build chronological timeline grouped by month
  const propColorMap = new Map((properties || []).map((p, i) => [p.id, { dot: DOT_COLORS[i % DOT_COLORS.length], hex: HEX_COLORS[i % HEX_COLORS.length] }]))
  const sorted = [...reservations].sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())
  const monthGroups: { label: string; isPast: boolean; items: typeof sorted }[] = []
  for (const res of sorted) {
    const d = new Date(res.checkIn)
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
    const isPast = new Date(res.checkOut) < now
    const last = monthGroups.at(-1)
    if (last && last.label === label) last.items.push(res)
    else monthGroups.push({ label, isPast, items: [res] })
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Buenas, {userName?.split(' ')[0]} 👋</h1>
        <p className="text-slate-400 text-sm">
          {pending > 0 ? `Tienes ${pending} check-ins pendientes` : 'Todo al día'}
        </p>
      </div>

      {/* Calendar */}
      <div className="mb-8">
        <Calendar
          reservations={reservations}
          properties={properties || []}
          year={now.getFullYear()}
          month={now.getMonth()}
        />
      </div>

      {/* Property cards */}
      {properties && properties.length > 0 && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.map((property, idx) => (
            <PropertyCard
              key={property.id}
              property={property}
              reservations={reservations}
              index={idx}
            />
          ))}
        </div>
      )}

      {/* Reservation list — split by property */}
      {properties && properties.length > 0 && reservations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5">
            Resumen de Reservas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {properties.map((prop, idx) => {
              const propRes = reservations.filter(r => r.propertyId === prop.id)
              const dotColor = DOT_COLORS[idx % DOT_COLORS.length]
              return (
                <div key={prop.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                    <h3 className="font-semibold text-slate-800 text-sm">{prop.name}</h3>
                  </div>
                  {propRes.length === 0 ? (
                    <p className="text-sm text-slate-400 pl-4">Sin reservas</p>
                  ) : (
                    <div>
                      {propRes.map((res) => {
                        const isReserved = !res.guestName || res.guestName.toLowerCase() === 'reserved'
                        const displayName = res.checkinStatus?.guestSurname
                          ?? (isReserved ? 'Reservado' : res.guestName!.trim().split(' ').at(-1)!)
                        return (
                          <Link
                            key={res.id}
                            href={`/dashboard/${res.propertyId}/${res.id}`}
                            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors group"
                          >
                            <span className="text-sm text-slate-700 group-hover:text-slate-900">
                              <span className="font-medium text-slate-900">{res.airbnbCode}</span>
                              <span className="text-slate-400 mx-1.5">·</span>
                              <span>{displayName}</span>
                            </span>
                            <div className="flex gap-1 shrink-0 ml-3">
                              <span className={`w-2 h-2 rounded-full ${res.checkinStatus?.formComplete ? 'bg-green-400' : 'bg-slate-300'}`} title="Formulario" />
                              <span className={`w-2 h-2 rounded-full ${res.checkinStatus?.txtGenerated ? 'bg-green-400' : 'bg-slate-300'}`} title=".txt" />
                              <span className={`w-2 h-2 rounded-full ${res.checkinStatus?.mossosSent ? 'bg-green-400' : 'bg-slate-300'}`} title="Mossos" />
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  res.checkinStatus?.taxPaymentMethod === 'online' || res.checkinStatus?.taxPaymentMethod === 'cash_paid'
                                    ? 'bg-emerald-500'
                                    : res.checkinStatus?.taxPaymentMethod === 'cash'
                                      ? 'bg-amber-400'
                                      : 'bg-slate-300'
                                }`}
                                title={
                                  res.checkinStatus?.taxPaymentMethod === 'online'    ? 'Tasa: pagada online' :
                                  res.checkinStatus?.taxPaymentMethod === 'cash_paid' ? 'Tasa: cobrada en efectivo' :
                                  res.checkinStatus?.taxPaymentMethod === 'cash'      ? 'Tasa: efectivo pendiente' :
                                  'Tasa: sin registrar'
                                }
                              />
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Chronological timeline */}
      {reservations.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5">
            Historial completo
          </h2>
          <div className="space-y-4">
            {monthGroups.map(({ label, items }) => (
              <div key={label}>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pb-1.5 border-b border-gray-100 mb-1">
                  {label}
                </p>
                {items.map(res => {
                  const isPast = new Date(res.checkOut) < now
                  const colors = propColorMap.get(res.propertyId)
                  const isReserved = !res.guestName || res.guestName.toLowerCase() === 'reserved'
                  const name = res.checkinStatus?.guestSurname
                    ?? (isReserved ? 'Reservado' : res.guestName!.trim().split(' ').at(-1)!)
                  return (
                    <Link
                      key={res.id}
                      href={`/dashboard/${res.propertyId}/${res.id}`}
                      className={`flex items-center justify-between py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors group ${isPast ? 'opacity-40' : ''}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors?.hex ?? '#94a3b8' }} />
                        <span className={`text-xs font-mono font-medium ${isPast ? 'text-slate-400' : 'text-slate-700'}`}>{res.airbnbCode}</span>
                        <span className="text-slate-300 text-xs">·</span>
                        <span className={`text-sm truncate ${isPast ? 'text-slate-400' : 'text-slate-700'}`}>{name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {new Date(res.checkIn).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          {' → '}
                          {new Date(res.checkOut).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                        <div className="flex gap-1">
                          <span className={`w-2 h-2 rounded-full ${res.checkinStatus?.formComplete ? 'bg-emerald-500' : 'bg-slate-300'}`} title="Formulario" />
                          <span className={`w-2 h-2 rounded-full ${res.checkinStatus?.txtGenerated ? 'bg-emerald-500' : 'bg-slate-300'}`} title=".txt" />
                          <span className={`w-2 h-2 rounded-full ${res.checkinStatus?.mossosSent ? 'bg-emerald-500' : 'bg-slate-300'}`} title="Mossos" />
                          <span
                            className={`w-2 h-2 rounded-full ${
                              res.checkinStatus?.taxPaymentMethod === 'online' || res.checkinStatus?.taxPaymentMethod === 'cash_paid' ? 'bg-emerald-500' :
                              res.checkinStatus?.taxPaymentMethod === 'cash' ? 'bg-amber-400' : 'bg-slate-300'
                            }`}
                            title={
                              res.checkinStatus?.taxPaymentMethod === 'online'    ? 'Tasa: pagada online' :
                              res.checkinStatus?.taxPaymentMethod === 'cash_paid' ? 'Tasa: cobrada en efectivo' :
                              res.checkinStatus?.taxPaymentMethod === 'cash'      ? 'Tasa: efectivo pendiente' :
                              'Tasa: sin registrar'
                            }
                          />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!properties || properties.length === 0) && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-slate-500 mb-4 font-medium">Añadir propiedad</p>
          <a href="/dashboard/settings/properties" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors text-sm">
            Empezar
          </a>
        </div>
      )}
    </div>
  )
}
