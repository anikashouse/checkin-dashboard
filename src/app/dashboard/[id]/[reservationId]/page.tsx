import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase'
import { getReservation } from '@/lib/db'
import TxtSection from '@/components/TxtSection'
import MossosSection from '@/components/MossosSection'

const db = supabaseAdmin ?? supabase

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

  const { data: checkinRecord } = await db
    .from('checkin_records')
    .select('txt_content, txt_filename, pdf_base64, mossos_sent')
    .eq('reservation_id', reservationId)
    .maybeSingle()

  const nights = res.nights ?? Math.ceil(
    (new Date(res.checkOut).getTime() - new Date(res.checkIn).getTime()) / (1000 * 60 * 60 * 24)
  )

  const guestName = res.guestName && res.guestName.toLowerCase() !== 'reserved'
    ? res.guestName
    : null

  const guests = res.checkinStatus?.guests ?? []

  return (
    <div className="p-8">
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

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">

        {/* Left column */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Reservation details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
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
            <div className="space-y-5">
              <StatusRow
                label="Formulario rellenado"
                status={res.checkinStatus?.formComplete ? 'ok' : 'pending'}
                description={res.checkinStatus?.formComplete
                  ? 'El huésped ha completado el formulario de check-in'
                  : 'El huésped aún no ha completado el formulario de check-in'}
              />
              <div>
                <StatusRow
                  label="Fichero .txt"
                  status={res.checkinStatus?.txtGenerated ? 'ok' : 'pending'}
                  description={res.checkinStatus?.txtGenerated
                    ? checkinRecord?.txt_filename ?? 'Fichero disponible'
                    : 'Sin fichero .txt'}
                />
                <TxtSection
                  reservationId={reservationId}
                  txtContent={checkinRecord?.txt_content ?? null}
                  txtFilename={checkinRecord?.txt_filename ?? null}
                />
              </div>
              <div>
                <StatusRow
                  label="Enviado a Mossos"
                  status={res.checkinStatus?.mossosSent ? 'ok' : 'pending'}
                  description={res.checkinStatus?.mossosSent
                    ? `Enviado${res.checkinStatus.sentAt ? ` el ${new Date(res.checkinStatus.sentAt).toLocaleDateString('es-ES')}` : ''}`
                    : 'Pendiente de envío'}
                />
                <MossosSection
                  reservationId={reservationId}
                  hasTxt={res.checkinStatus?.txtGenerated ?? false}
                  pdfBase64={checkinRecord?.pdf_base64 ?? null}
                  mossosSent={checkinRecord?.mossos_sent ?? false}
                />
              </div>
            </div>
          </div>

        </div>{/* end left column */}

        {/* Right column — guest data */}
        <div className="w-72 shrink-0">
          {guests.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5">
                Datos de los huéspedes
              </h2>
              <div className="space-y-5">
                {guests.map((g, i) => (
                  <div key={i} className={i > 0 ? 'pt-5 border-t border-gray-100' : ''}>
                    <p className="text-sm font-semibold text-slate-900 mb-3">
                      {[g.nom, g.ap1, g.ap2].filter(Boolean).join(' ') || `Huésped ${i + 1}`}
                    </p>
                    <dl className="space-y-2">
                      {g.nac && <div><dt className="text-xs text-slate-400">Nacionalidad</dt><dd className="text-sm font-medium text-slate-900">{g.nac}</dd></div>}
                      {g.sexe && <div><dt className="text-xs text-slate-400">Sexo</dt><dd className="text-sm font-medium text-slate-900">{g.sexe === 'M' ? 'Masculino' : g.sexe === 'F' ? 'Femenino' : g.sexe}</dd></div>}
                      {g.naix && <div><dt className="text-xs text-slate-400">Fecha nacimiento</dt><dd className="text-sm font-medium text-slate-900">{g.naix.replace(/(\d{4})(\d{2})(\d{2})/, '$3/$2/$1')}</dd></div>}
                      {g.numdoc && <div><dt className="text-xs text-slate-400">Documento ({g.tipo})</dt><dd className="text-sm font-medium text-slate-900 font-mono">{g.numdoc}</dd></div>}
                      {g.tel && <div><dt className="text-xs text-slate-400">Teléfono</dt><dd className="text-sm font-medium text-slate-900">{g.tel}</dd></div>}
                      {g.email && <div><dt className="text-xs text-slate-400">Email</dt><dd className="text-sm font-medium text-slate-900 break-all">{g.email}</dd></div>}
                    </dl>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-6 text-center">
              <p className="text-xs text-slate-400">Sube un .txt para ver los datos de los huéspedes</p>
            </div>
          )}
        </div>

      </div>{/* end flex row */}
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
