'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GuestData } from '@/lib/types'
import { dedupeGuests, hasDuplicateGuests } from '@/lib/dedupeGuests'

// ── helpers ─────────────────────────────────────────────
function fmtDate(s?: string) {
  if (!s || s.length !== 8) return undefined
  return `${s.slice(6, 8)}/${s.slice(4, 6)}/${s.slice(0, 4)}`
}
function fmtTime(s?: string) {
  if (!s || s.length < 4) return undefined
  return `${s.slice(0, 2)}:${s.slice(2, 4)}`
}
function toInput(s?: string) {
  if (!s || s.length !== 8) return ''
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}
function fromInput(s?: string) { return (s || '').replace(/-/g, '') }
function toTimeInput(s?: string) {
  if (!s || s.length < 4) return ''
  return `${s.slice(0, 2)}:${s.slice(2, 4)}`
}
function fromTimeInput(s?: string) { return (s || '').replace(':', '') }

const DOC_LABEL: Record<string, string> = { D: 'DNI', N: 'NIE', P: 'Pasaporte', O: 'Otro' }
const SEX_LABEL: Record<string, string> = { M: 'Masculino', F: 'Femenino' }

// ── read-only sub-components ────────────────────────────
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

// ── field input helper ───────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[9px] text-slate-400 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}
const inputCls = 'text-[11px] border border-slate-200 rounded px-2 py-1 w-full focus:outline-none focus:border-slate-400 bg-white'
const selectCls = inputCls

// ── edit form for one guest ──────────────────────────────
function GuestEditForm({
  g, index, allGuests, reservationId, onCancel, onSaved,
}: {
  g: GuestData; index: number; allGuests: GuestData[]
  reservationId: string; onCancel: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState<GuestData>({ ...g })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const set = (k: keyof GuestData, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    setSaving(true)
    setErr('')
    const updated = allGuests.map((guest, i) => (i === index ? form : guest))
    try {
      const res = await fetch('/api/mossos/save-guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId, guestData: updated }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Error') }
      onSaved()
    } catch (e: any) {
      setErr(e.message)
      setSaving(false)
    }
  }

  const isEsp = (form.pais_residencia || 'ESP').toUpperCase() === 'ESP'

  return (
    <div className="px-4 py-4 bg-slate-50 border-t border-slate-100 space-y-4">

      {/* Documento */}
      <div>
        <PanelTitle>Documento</PanelTitle>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Tipo">
            <select className={selectCls} value={form.tipo || 'P'} onChange={e => set('tipo', e.target.value)}>
              {Object.entries(DOC_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Número">
            <input className={inputCls} value={form.numdoc || ''} onChange={e => set('numdoc', e.target.value.toUpperCase())} />
          </Field>
          {(form.tipo === 'D' || form.tipo === 'N') && (
            <Field label="Nº soporte (9 chars)">
              <input className={inputCls} maxLength={9} value={form.soporte_dni || ''} onChange={e => set('soporte_dni', e.target.value.toUpperCase())} />
            </Field>
          )}
          <Field label="F. expedición">
            <input type="date" className={inputCls} value={toInput(form.expedicion)} onChange={e => set('expedicion', fromInput(e.target.value))} />
          </Field>
        </div>
      </div>

      {/* Identidad */}
      <div>
        <PanelTitle>Identidad</PanelTitle>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Apellido 1"><input className={inputCls} value={form.ap1 || ''} onChange={e => set('ap1', e.target.value)} /></Field>
          <Field label="Apellido 2"><input className={inputCls} value={form.ap2 || ''} onChange={e => set('ap2', e.target.value)} /></Field>
          <Field label="Nombre"><input className={inputCls} value={form.nom || ''} onChange={e => set('nom', e.target.value)} /></Field>
          <Field label="Sexo">
            <select className={selectCls} value={form.sexe || 'M'} onChange={e => set('sexe', e.target.value)}>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </Field>
          <Field label="F. nacimiento">
            <input type="date" className={inputCls} value={toInput(form.naix)} onChange={e => set('naix', fromInput(e.target.value))} />
          </Field>
          <Field label="Nacionalidad">
            <input className={inputCls} maxLength={3} value={form.nac || ''} onChange={e => set('nac', e.target.value.toUpperCase())} />
          </Field>
        </div>
      </div>

      {/* Estancia */}
      <div>
        <PanelTitle>Estancia</PanelTitle>
        <div className="grid grid-cols-4 gap-2">
          <Field label="Entrada">
            <input type="date" className={inputCls} value={toInput(form.entrada)} onChange={e => set('entrada', fromInput(e.target.value))} />
          </Field>
          <Field label="Hora entrada">
            <input type="time" className={inputCls} value={toTimeInput(form.hora_entrada)} onChange={e => set('hora_entrada', fromTimeInput(e.target.value))} />
          </Field>
          <Field label="Salida">
            <input type="date" className={inputCls} value={toInput(form.salida)} onChange={e => set('salida', fromInput(e.target.value))} />
          </Field>
          <Field label="Hora salida">
            <input type="time" className={inputCls} value={toTimeInput(form.hora_salida)} onChange={e => set('hora_salida', fromTimeInput(e.target.value))} />
          </Field>
        </div>
      </div>

      {/* Contacto */}
      <div>
        <PanelTitle>Contacto</PanelTitle>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Teléfono"><input className={inputCls} value={form.tel || ''} onChange={e => set('tel', e.target.value)} /></Field>
          <Field label="Email"><input type="email" className={inputCls} value={form.email || ''} onChange={e => set('email', e.target.value.toLowerCase())} /></Field>
        </div>
      </div>

      {/* Dirección */}
      <div>
        <PanelTitle>Dirección</PanelTitle>
        <div className="grid grid-cols-3 gap-2">
          <Field label="País (3 letras)">
            <input className={inputCls} maxLength={3} value={form.pais_residencia || 'ESP'} onChange={e => set('pais_residencia', e.target.value.toUpperCase())} />
          </Field>
          <Field label="Dirección" ><input className={inputCls} value={form.direccion || ''} onChange={e => set('direccion', e.target.value)} /></Field>
          <Field label="CP"><input className={inputCls} value={form.cp || ''} onChange={e => set('cp', e.target.value)} /></Field>
          {isEsp ? (
            <>
              <Field label="Provincia"><input className={inputCls} value={form.provincia || ''} onChange={e => set('provincia', e.target.value)} /></Field>
              <Field label="Municipio"><input className={inputCls} value={form.municipio || ''} onChange={e => set('municipio', e.target.value)} /></Field>
            </>
          ) : (
            <Field label="Localidad"><input className={inputCls} value={form.localidad || ''} onChange={e => set('localidad', e.target.value)} /></Field>
          )}
        </div>
      </div>

      {err && <p className="text-xs text-red-500">{err}</p>}

      <div className="flex gap-2 pt-1">
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando…' : 'Guardar y regenerar .txt'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── read-only guest card ─────────────────────────────────
function GuestCardView({ g, index, onEdit, onDelete, canDelete }: { g: GuestData; index: number; onEdit: () => void; onDelete: () => void; canDelete: boolean }) {
  const fullName = [g.ap1, g.ap2, g.nom].filter(Boolean).join(' ') || `Huésped ${index + 1}`
  const demographics = [SEX_LABEL[g.sexe || ''], g.nac, fmtDate(g.naix), g.menor === 'S' ? 'Menor' : null].filter(Boolean).join(' · ')
  const city = g.municipio || g.localidad
  const addressLine = [g.direccion, [g.cp, city].filter(Boolean).join(' '), g.provincia, g.pais_residencia].filter(Boolean).join(', ')
  const hasDoc  = g.numdoc || g.soporte_dni || g.expedicion
  const hasContact = g.tel || g.email
  const hasReserva = g.airbnb_code_txt || g.num_viajeros

  return (
    <>
      <div className="px-4 py-2.5 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="font-bold text-slate-900 text-sm">{fullName}</p>
          {demographics && <p className="text-[10px] text-slate-400 mt-0.5">{demographics}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onEdit}
            className="text-[10px] text-slate-400 hover:text-slate-700 border border-slate-200 rounded px-2 py-0.5 transition-colors"
          >
            Editar
          </button>
          {canDelete && (
            <button
              onClick={onDelete}
              className="text-[10px] text-red-400 hover:text-red-600 border border-red-100 rounded px-2 py-0.5 transition-colors"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        <div className="grid grid-cols-2 divide-x divide-gray-100">
          <div className="px-4 py-3">
            <PanelTitle>Documento</PanelTitle>
            <dl className="space-y-1">
              <DataRow label={DOC_LABEL[g.tipo || ''] ?? 'Número'} value={g.numdoc} mono />
              <DataRow label="Nº soporte" value={g.soporte_dni} mono />
              <DataRow label="Expedición" value={fmtDate(g.expedicion)} />
            </dl>
          </div>
          <div className="px-4 py-3">
            <PanelTitle>Estancia</PanelTitle>
            <dl className="space-y-1">
              <DataRow label="Entrada" value={fmtDate(g.entrada) + (g.hora_entrada ? ` ${fmtTime(g.hora_entrada)}` : '')} />
              <DataRow label="Salida"  value={fmtDate(g.salida) + (g.hora_salida ? ` ${fmtTime(g.hora_salida)}` : '')} />
            </dl>
          </div>
        </div>
        {hasReserva && (
          <div className="px-4 py-3">
            <PanelTitle>Reserva</PanelTitle>
            <dl className="grid grid-cols-3 gap-x-8 gap-y-1">
              <DataRow label="Cód. Airbnb" value={g.airbnb_code_txt} mono />
              <DataRow label="Viajeros"   value={g.num_viajeros} />
            </dl>
          </div>
        )}
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
    </>
  )
}

// ── main export ──────────────────────────────────────────
export default function EditGuestCards({
  guests, reservationId,
}: {
  guests: GuestData[]; reservationId: string
}) {
  const router = useRouter()
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  function handleSaved() {
    setEditingIndex(null)
    router.refresh()
  }

  // Persist a new guest array (delete / merge duplicates). save-guests dedupes,
  // regenerates the .txt and sets mossos_sent=false so it can be re-sent.
  async function persist(updated: GuestData[]) {
    setBusy(true)
    setErr('')
    try {
      const res = await fetch('/api/mossos/save-guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId, guestData: updated }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Error') }
      router.refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error')
    } finally {
      setBusy(false)
    }
  }

  function deleteGuest(index: number) {
    const g = guests[index]
    const name = [g.ap1, g.ap2, g.nom].filter(Boolean).join(' ') || `Huésped ${index + 1}`
    if (guests.length <= 1) { setErr('No puedes eliminar el único viajero de la reserva.'); return }
    if (!confirm(`¿Eliminar a ${name} de esta reserva? Se regenerará el parte de Mossos.`)) return
    persist(guests.filter((_, i) => i !== index))
  }

  const dupes = hasDuplicateGuests(guests)

  return (
    <div className="flex flex-col gap-3 pb-6">
      {dupes && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
          <span className="text-[11px] text-orange-800">Se han detectado <b>viajeros duplicados</b> (misma persona registrada dos veces).</span>
          <button
            onClick={() => persist(dedupeGuests(guests))}
            disabled={busy}
            className="shrink-0 rounded bg-orange-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {busy ? 'Combinando…' : 'Combinar duplicados'}
          </button>
        </div>
      )}
      {err && <p className="text-[11px] text-red-500">{err}</p>}

      {guests.map((g, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <GuestCardView
            g={g}
            index={i}
            onEdit={() => setEditingIndex(i)}
            onDelete={() => deleteGuest(i)}
            canDelete={guests.length > 1 && !busy}
          />
          {editingIndex === i && (
            <GuestEditForm
              g={g}
              index={i}
              allGuests={guests}
              reservationId={reservationId}
              onCancel={() => setEditingIndex(null)}
              onSaved={handleSaved}
            />
          )}
        </div>
      ))}
    </div>
  )
}
