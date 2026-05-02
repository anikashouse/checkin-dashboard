import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase'
import { getReservation } from '@/lib/db'
import TxtSection from '@/components/TxtSection'
import MossosSection from '@/components/MossosSection'
import ManualCheckinForm from '@/components/ManualCheckinForm'
import type { GuestData } from '@/lib/types'

const db = supabaseAdmin ?? supabase

function fmtDate(s?: string): string | undefined {
  if (!s || s.length !== 8) return undefined
  return `${s.slice(6,8)}/${s.slice(4,6)}/${s.slice(0,4)}`
}
function fmtDateTime(date?: string, time?: string): string | undefined {
  const d = fmtDate(date)
  if (!d) return undefined
  if (!time || time.length < 4) return d
  return `${d} ${time.slice(0,2)}:${time.slice(2,4)}`
}
function docLabel(tipo?: string): string | undefined {
  if (!tipo) return undefined
  return ({ D: 'DNI', N: 'NIE', P: 'Pasaporte', O: 'Otro doc.' } as Record<string,string>)[tipo] ?? tipo
}
function menorLabel(s?: string): string | undefined {
  if (s === 'S') return 'Sí'
  if (s === 'N') return 'No'
  return undefined
}
function sexLabel(s?: string): string | undefined {
  if (s === 'M') return 'Masculino'
  if (s === 'F') return 'Femenino'
  return undefined
}
function contratoLabel(s?: string): string | undefined {
  if (s === 'R') return 'Reserva futura'
  if (s === 'C') return 'Check-in inmediato'
  return undefined
}

function Field({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{label}</dt>
      <dd className={`text-xs text-slate-900 mt-0.5 ${mono ? 'font-mono' : 'font-medium'}`}>{value}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-1.5">{title}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">{children}</dl>
    </div>
  )
}

function GuestCard({ g, index }: { g: GuestData; index: number }) {
  const fullName = [g.ap1, g.ap2, g.nom].filter(Boolean).join(' ') || `Huésped ${index + 1}`
  const hasDoc     = g.numdoc || g.soporte_dni || g.expedicion
  const hasContact = g.tel || g.email
  const city = g.municipio || g.localidad
  const hasAddress = g.direccion || city || g.cp || g.pais_residencia

  const addressLine = [
    g.direccion,
    [g.cp, city].filter(Boolean).join(' '),
    g.provincia,
    g.pais_residencia,
  ].filter(Boolean).join(', ')

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-gray-100">
        <p className="font-bold text-slate-900 text-sm">{fullName}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {[sexLabel(g.sexe), g.nac, fmtDate(g.naix), menorLabel(g.menor) ? `Menor: ${menorLabel(g.menor)}` : null].filter(Boolean).join(' · ')}
        </p>
      </div>

      <div className="px-4 py-3 space-y-3">
        {hasDoc && (
          <Section title="Documento">
            <Field label={docLabel(g.tipo) ?? 'Documento'} value={g.numdoc} mono />
            <Field label="Expedición" value={fmtDate(g.expedicion)} />
            <Field label="Nº soporte DNI" value={g.soporte_dni} mono />
          </Section>
        )}

        <Section title="Estancia">
          <Field label="Entrada" value={fmtDateTime(g.entrada, g.hora_entrada)} />
          <Field label="Salida"  value={fmtDateTime(g.salida, g.hora_salida)} />
        </Section>

        {(g.fecha_contrato || g.tipo_contrato || g.airbnb_code_txt || g.num_viajeros || g.num_habitaciones || g.tipo_pago) && (
          <Section title="Reserva">
            <Field label="Cód. Airbnb"  value={g.airbnb_code_txt} mono />
            <Field label="Fecha contrato" value={fmtDate(g.fecha_contrato)} />
            <Field label="Tipo contrato" value={contratoLabel(g.tipo_contrato)} />
            <Field label="Nº viajeros"  value={g.num_viajeros} />
            <Field label="Habitaciones" value={g.num_habitaciones} />
            <Field label="Tipo pago"    value={g.tipo_pago} />
          </Section>
        )}

        {hasContact && (
          <Section title="Contacto">
            <Field label="Teléfono" value={g.tel} />
            <Field label="Email" value={g.email} />
          </Section>
        )}

        {hasAddress && (
          <div>
            <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-1.5">Dirección</p>
            <p className="text-sm text-slate-900 font-medium">{addressLine}</p>
          </div>
        )}
      </div>
    </div>
  )
}

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
    ? res.guestName : null

  const guests = res.checkinStatus?.guests ?? []

  return (
    <div className="p-6 flex flex-col h-full">
      {/* Back */}
      <Link
        href={`/dashboard/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-4"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {property.name}
      </Link>

      {/* Title */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">{guestName ?? res.airbnbCode}</h1>
        {guestName && <p className="text-slate-400 text-xs mt-0.5">{res.airbnbCode}</p>}
      </div>

      {/* Layout */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* Left — reservation + mossos */}
        <div className="w-80 shrink-0 space-y-3">

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Detalles de la reserva</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <dt className="text-[10px] text-slate-400">Check-in</dt>
                <dd className="font-semibold text-slate-900 text-xs mt-0.5">
                  {new Date(res.checkIn).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] text-slate-400">Check-out</dt>
                <dd className="font-semibold text-slate-900 text-xs mt-0.5">
                  {new Date(res.checkOut).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] text-slate-400">Noches</dt>
                <dd className="font-semibold text-slate-900 text-xs mt-0.5">{nights}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-slate-400">Huéspedes</dt>
                <dd className="font-semibold text-slate-900 text-xs mt-0.5">{res.guests ?? '—'}</dd>
              </div>
              {res.tel_suffix && (
                <div>
                  <dt className="text-[10px] text-slate-400">Tel (últimos 4)</dt>
                  <dd className="font-semibold text-slate-900 text-xs mt-0.5">···{res.tel_suffix}</dd>
                </div>
              )}
              <div>
                <dt className="text-[10px] text-slate-400">Propiedad</dt>
                <dd className="font-semibold text-slate-900 text-xs mt-0.5 leading-tight">{property.name}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Estado Mossos</h2>
            <div className="space-y-3">
              <StatusRow
                label="Formulario rellenado"
                status={res.checkinStatus?.formComplete ? 'ok' : 'pending'}
                description={res.checkinStatus?.formComplete
                  ? 'Formulario completado por el huésped'
                  : 'El huésped aún no ha completado el formulario'}
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

        </div>

        {/* Right — guest cards */}
        <div
          className="flex-1 min-w-0 grid gap-3"
          style={guests.length > 0 ? { gridTemplateRows: `repeat(${guests.length}, 1fr)` } : undefined}
        >
          {guests.length > 0 ? (
            guests.map((g, i) => <GuestCard key={i} g={g} index={i} />)
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center text-center gap-3">
              <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div>
                <p className="text-sm text-slate-400">Sin datos de huéspedes</p>
                <p className="text-xs text-slate-300 mt-0.5">El huésped no ha rellenado el formulario todavía</p>
              </div>
              {!res.checkinStatus?.formComplete && (
                <ManualCheckinForm
                  reservationId={reservationId}
                  airbnbCode={res.airbnbCode ?? ''}
                  checkIn={res.checkIn}
                  checkOut={res.checkOut}
                  totalGuests={res.guests ?? 1}
                  mossosId={property.mossos_id ?? 'ID50044239'}
                  establishmentName={property.name}
                />
              )}
            </div>
          )}
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
  const dot = status === 'ok' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-slate-300'
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
