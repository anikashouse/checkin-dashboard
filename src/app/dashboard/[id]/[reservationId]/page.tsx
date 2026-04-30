import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getReservation } from '@/lib/db'

export default async function ReservationPage({
  params,
}: {
  params: Promise<{ id: string; reservationId: string }>
}) {
  const { id, reservationId } = await params
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) redirect('/auth/signin')

  const { data: properties } = await supabase.from('properties').select('*').eq('user_id', userId)
  const property = (properties || []).find((p: any) => p.id === id)
  if (!property) redirect('/dashboard')

  const res = await getReservation(reservationId)
  if (!res || res.propertyId !== id) redirect(`/dashboard/${id}`)

  const nights = res.nights ?? Math.ceil(
    (new Date(res.checkOut).getTime() - new Date(res.checkIn).getTime()) / (1000 * 60 * 60 * 24)
  )

  const guestName = res.guestName && res.guestName.toLowerCase() !== 'reserved'
    ? res.guestName
    : null

  return (
    <div className="p-8 max-w-2xl">
      {/* Back */}
      <Link
        href={`/dashboard/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-8"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {property.name}
      </Link>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {guestName ?? res.airbnbCode}
        </h1>
        {guestName && (
          <p className="text-slate-400 text-sm mt-1">{res.airbnbCode}</p>
        )}
      </div>

      {/* Reservation details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5">
          Detalles de la reserva
        </h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-5">
          <div>
            <dt className="text-xs text-slate-400 mb-1">Check-in</dt>
            <dd className="font-semibold text-slate-900 text-sm">
              {new Date(res.checkIn).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400 mb-1">Check-out</dt>
            <dd className="font-semibold text-slate-900 text-sm">
              {new Date(res.checkOut).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400 mb-1">Noches</dt>
            <dd className="font-semibold text-slate-900">{nights}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400 mb-1">Huéspedes</dt>
            <dd className="font-semibold text-slate-900">{res.guests ?? '—'}</dd>
          </div>
          {res.tel_suffix && (
            <div>
              <dt className="text-xs text-slate-400 mb-1">Teléfono (últimos 4)</dt>
              <dd className="font-semibold text-slate-900">···{res.tel_suffix}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-slate-400 mb-1">Propiedad</dt>
            <dd className="font-semibold text-slate-900">{property.name}</dd>
          </div>
        </dl>
      </div>

      {/* Mossos status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5">
          Estado Mossos
        </h2>
        <div className="space-y-4">
          <StatusRow
            label="Formulario rellenado"
            status={res.checkinStatus?.formComplete ? 'ok' : 'pending'}
            description={res.checkinStatus?.formComplete
              ? 'El huésped ha completado el formulario de check-in'
              : 'El huésped aún no ha completado el formulario de check-in'}
          />
          <StatusRow
            label="Fichero .txt generado"
            status={res.checkinStatus?.txtGenerated ? 'ok' : 'pending'}
            description={res.checkinStatus?.txtGenerated
              ? `Fichero generado${res.checkinStatus ? '' : ''}`
              : 'Pendiente de generación'}
          />
          <StatusRow
            label="Enviado a Mossos"
            status={res.checkinStatus?.mossosSent ? 'ok' : 'pending'}
            description={res.checkinStatus?.mossosSent
              ? `Enviado${res.checkinStatus.sentAt ? ` el ${new Date(res.checkinStatus.sentAt).toLocaleDateString('es-ES')}` : ''}`
              : 'Pendiente de envío'}
          />
        </div>

        <div className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap gap-2">
          <button disabled className="px-4 py-2 bg-gray-100 text-slate-400 text-sm font-medium rounded-lg cursor-not-allowed">
            Enviar enlace al huésped
          </button>
          <button disabled className="px-4 py-2 bg-gray-100 text-slate-400 text-sm font-medium rounded-lg cursor-not-allowed">
            Generar .txt
          </button>
          <button disabled className="px-4 py-2 bg-gray-100 text-slate-400 text-sm font-medium rounded-lg cursor-not-allowed">
            Enviar a Mossos
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusRow({ label, status, description }: {
  label: string
  status: 'ok' | 'error' | 'pending'
  description: string
}) {
  const dot =
    status === 'ok'    ? 'bg-green-500' :
    status === 'error' ? 'bg-red-500'   :
                         'bg-slate-300'
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
    </div>
  )
}
