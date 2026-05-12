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
import TaxPaymentControl from '@/components/TaxPaymentControl'
import PayLinkButton from '@/components/PayLinkButton'
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

function DataRow({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null
  return (
    <div className="flex items-baseline gap-1.5 min-w-0">
      <dt className="text-[9px] text-slate-400 shrink-0 whitespace-nowrap">{label}:</dt>
      <dd className={`text-[11px] text-slate-900 font-medium min-w-0 break-all ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  )
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest mb-2">{children}</p>
}

function GuestCard({ g, index }: { g: GuestData; index: number }) {
  const fullName = [g.ap1, g.ap2, g.nom].filter(Boolean).join(' ') || `Huésped ${index + 1}`
  const demographics = [sexLabel(g.sexe), g.nac, fmtDate(g.naix), g.menor === 'S' ? 'Menor' : null].filter(Boolean).join(' · ')

  const city = g.municipio || g.localidad
  const addressLine = [
    g.direccion,
    [g.cp, city].filter(Boolean).join(' '),
    g.provincia,
    g.pais_residencia,
  ].filter(Boolean).join(', ')

  const hasDoc     = g.numdoc || g.soporte_dni || g.expedicion
  const hasContact = g.tel || g.email
  const hasReserva = g.fecha_contrato || g.tipo_contrato || g.airbnb_code_txt || g.num_viajeros || g.num_habitaciones || g.tipo_pago

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">

      {/* Header */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-gray-100">
        <p className="font-bold text-slate-900 text-sm">{fullName}</p>
        {demographics && <p className="text-[10px] text-slate-400 mt-0.5">{demographics}</p>}
      </div>

      <div className="divide-y divide-gray-100">

        {/* Documento + Estancia */}
        <div className="grid grid-cols-2 divide-x divide-gray-100">
          <div className="px-4 py-3">
            <PanelTitle>Documento</PanelTitle>
            <dl className="space-y-1">
              <DataRow label={docLabel(g.tipo) ?? 'Número'} value={g.numdoc} mono />
              <DataRow label="Nº soporte" value={g.soporte_dni} mono />
              <DataRow label="Expedición" value={fmtDate(g.expedicion)} />
            </dl>
          </div>
          <div className="px-4 py-3">
            <PanelTitle>Estancia</PanelTitle>
            <dl className="space-y-1">
              <DataRow label="Entrada" value={fmtDateTime(g.entrada, g.hora_entrada)} />
              <DataRow label="Salida"  value={fmtDateTime(g.salida, g.hora_salida)} />
            </dl>
          </div>
        </div>

        {/* Reserva */}
        {hasReserva && (
          <div className="px-4 py-3">
            <PanelTitle>Reserva</PanelTitle>
            <dl className="grid grid-cols-3 gap-x-8 gap-y-1">
              <DataRow label="Cód. Airbnb"   value={g.airbnb_code_txt} mono />
              <DataRow label="F. contrato"   value={fmtDate(g.fecha_contrato)} />
              <DataRow label="Tipo"          value={contratoLabel(g.tipo_contrato)} />
              <DataRow label="Viajeros"      value={g.num_viajeros} />
              <DataRow label="Habitaciones"  value={g.num_habitaciones} />
              <DataRow label="Pago"          value={g.tipo_pago} />
            </dl>
          </div>
        )}

        {/* Contacto + Dirección */}
        {(hasContact || addressLine) && (
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            <div className="px-4 py-3">
              {hasContact && <>
                <PanelTitle>Contacto</PanelTitle>
                <dl className="space-y-1">
                  <DataRow label="Teléfono" value={g.tel} />
                  <DataRow label="Email"    value={g.email} />
                </dl>
              </>}
            </div>
            <div className="px-4 py-3">
              {addressLine && <>
                <PanelTitle>Dirección</PanelTitle>
                <p className="text-[11px] text-slate-900 font-medium leading-snug">{addressLine}</p>
              </>}
            </div>
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
    .select('txt_content, txt_filename, pdf_base64, mossos_sent, tax_payment_method')
    .eq('reservation_id', reservationId)
    .maybeSingle()

  const nights = res.nights ?? Math.ceil(
    (new Date(res.checkOut).getTime() - new Date(res.checkIn).getTime()) / (1000 * 60 * 60 * 24)
  )

  const guestName = res.guestName && res.guestName.toLowerCase() !== 'reserved'
    ? res.guestName : null

  const guests = res.checkinStatus?.guests ?? []

  return (
    <div className="p-4">
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
      <div className="flex gap-4 items-start">

        {/* Left — reservation + mossos — sticky so it stays visible while scrolling guests */}
        <div className="w-64 shrink-0 space-y-2 sticky top-4">

          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <h2 className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Detalles de la reserva</h2>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
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

          {/* Tasa turística */}
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <h2 className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Tasa turística</h2>
            <StatusRow
              label={
                checkinRecord?.tax_payment_method === 'online'    ? 'Pagada online' :
                checkinRecord?.tax_payment_method === 'cash_paid' ? 'Cobrada en efectivo' :
                checkinRecord?.tax_payment_method === 'cash'      ? 'Pendiente — efectivo' :
                'Sin información'
              }
              status={
                checkinRecord?.tax_payment_method === 'online'    ? 'ok' :
                checkinRecord?.tax_payment_method === 'cash_paid' ? 'ok' :
                checkinRecord?.tax_payment_method === 'cash'      ? 'error' :
                'pending'
              }
              description={
                checkinRecord?.tax_payment_method === 'cash' ? '⚠ Cobrar en el check-in' : ''
              }
            />
            {checkinRecord && (
              <TaxPaymentControl
                reservationId={reservationId}
                current={checkinRecord.tax_payment_method as any ?? null}
              />
            )}
            <PayLinkButton reservationId={reservationId} />
          </div>

          {/* Mossos */}
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <h2 className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Estado Mossos</h2>
            <div className="space-y-2">
              <StatusRow
                label="Formulario"
                status={res.checkinStatus?.formComplete ? 'ok' : 'pending'}
                description={res.checkinStatus?.formComplete ? 'Completado' : 'Pendiente'}
              />
              <div>
                <StatusRow
                  label="Fichero .txt"
                  status={res.checkinStatus?.txtGenerated ? 'ok' : 'pending'}
                  description={res.checkinStatus?.txtGenerated
                    ? checkinRecord?.txt_filename ?? 'Disponible'
                    : 'Sin fichero'}
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
                    : 'Pendiente'}
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

        {/* Right — guest cards — natural height, page scrolls */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 pb-6">
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
    <div className="flex items-start gap-2">
      <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <div>
        <p className="text-[11px] font-medium text-slate-900">{label}</p>
        {description && <p className="text-[10px] text-slate-400">{description}</p>}
      </div>
    </div>
  )
}
