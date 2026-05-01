import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase'
import { getReservation } from '@/lib/db'
import TxtSection from '@/components/TxtSection'
import MossosSection from '@/components/MossosSection'
import type { GuestData } from '@/lib/types'

const db = supabaseAdmin ?? supabase

function fmtDate(s?: string) {
  if (!s || s.length !== 8) return s ?? '—'
  return `${s.slice(6,8)}/${s.slice(4,6)}/${s.slice(0,4)}`
}
function fmtTime(s?: string) {
  if (!s || s.length < 4) return ''
  return ` ${s.slice(0,2)}:${s.slice(2,4)}`
}
function docLabel(tipo?: string) {
  return ({ D: 'DNI', N: 'NIE', P: 'Pasaporte', O: 'Otro doc.' } as Record<string,string>)[tipo ?? ''] ?? tipo ?? '—'
}
function soporteLabel(s?: string) {
  return ({ C: 'Chip', B: 'Cód. barras', M: 'Manual' } as Record<string,string>)[s ?? ''] ?? s ?? '—'
}
function sexLabel(s?: string) {
  return s === 'M' ? 'Masculino' : s === 'F' ? 'Femenino' : s ?? '—'
}

function Field({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className={`text-sm text-slate-900 ${mono ? 'font-mono' : 'font-medium'}`}>{value}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-2">{title}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</dl>
    </div>
  )
}

function GuestCard({ g, index }: { g: GuestData; index: number }) {
  const fullName = [g.nom, g.ap1, g.ap2].filter(Boolean).join(' ') || `Huésped ${index + 1}`
  const hasDoc     = g.numdoc || g.suport || g.expedicion || g.soporte
  const hasContact = g.tel || g.email
  const hasAddress = g.direccion || g.municipio || g.cp || g.pais_residencia

  const addressLine = [g.direccion, [g.cp, g.municipio].filter(Boolean).join(' '), g.pais_residencia].filter(Boolean).join(', ')

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-4 bg-slate-50 border-b border-gray-100">
        <p className="font-bold text-slate-900 text-base">{fullName}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {[sexLabel(g.sexe), g.nac, g.naix ? fmtDate(g.naix) : null].filter(Boolean).join(' · ')}
        </p>
      </div>

      <div className="px-5 py-4 space-y-5">
        {hasDoc && (
          <Section title="Documento">
            <Field label={docLabel(g.tipo)} value={g.numdoc} mono />
            <Field label="Nº soporte" value={g.suport} mono />
            <Field label="Expedición" value={fmtDate(g.expedicion)} />
            <Field label="Lectura" value={soporteLabel(g.soporte)} />
          </Section>
        )}

        <Section title="Estancia">
          <Field label="Entrada" value={`${fmtDate(g.entrada)}${fmtTime(g.hora_entrada)}`} />
          <Field label="Salida"  value={`${fmtDate(g.salida)}${fmtTime(g.hora_salida)}`} />
        </Section>

        {hasContact && (
          <Section title="Contacto">
            <Field label="Teléfono" value={g.tel} />
            <Field label="Email" value={g.email} />
          </Section>
        )}

        {hasAddress && (
          <div>
            <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-2">Dirección</p>
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
    <div className="p-8">
      {/* Back */}
      <Link
        href={`/dashboard/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {property.name}
      </Link>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{guestName ?? res.airbnbCode}</h1>
        {guestName && <p className="text-slate-400 text-sm mt-1">{res.airbnbCode}</p>}
      </div>

      {/* Layout */}
      <div className="flex gap-6 items-start">

        {/* Left — reservation + mossos */}
        <div className="w-96 shrink-0 space-y-4">

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5">Detalles de la reserva</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <dt className="text-xs text-slate-400 mb-1">Check-in</dt>
                <dd className="font-semibold text-slate-900 text-sm">
                  {new Date(res.checkIn).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 mb-1">Check-out</dt>
                <dd className="font-semibold text-slate-900 text-sm">
                  {new Date(res.checkOut).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
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
                  <dt className="text-xs text-slate-400 mb-1">Tel (últimos 4)</dt>
                  <dd className="font-semibold text-slate-900">···{res.tel_suffix}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-slate-400 mb-1">Propiedad</dt>
                <dd className="font-semibold text-slate-900 text-xs leading-tight">{property.name}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5">Estado Mossos</h2>
            <div className="space-y-5">
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
        <div className="flex-1 min-w-0 space-y-4">
          {guests.length > 0 ? (
            guests.map((g, i) => <GuestCard key={i} g={g} index={i} />)
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 flex flex-col items-center justify-center text-center gap-2">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="text-sm text-slate-400">Sin datos de huéspedes</p>
              <p className="text-xs text-slate-300">Sube un fichero .txt para ver la información</p>
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
