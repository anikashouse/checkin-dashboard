'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  reservationId: string
  airbnbCode: string
  checkIn: string   // YYYY-MM-DD
  checkOut: string
  totalGuests: number
  mossosId: string
  establishmentName: string
}

interface GuestForm {
  tipo: string
  numdoc: string
  soporte: string
  ap1: string
  ap2: string
  nom: string
  sexe: string
  naix: string
  exp: string
  nac: string
  tel: string
  email: string
  adreca: string
  pais_postal: string
  localitat: string
  provincia: string
  municipi: string
  cp: string
}

const EMPTY_GUEST: GuestForm = {
  tipo: 'P', numdoc: '', soporte: '', ap1: '', ap2: '', nom: '',
  sexe: 'M', naix: '', exp: '', nac: 'ESP', tel: '', email: '',
  adreca: '', pais_postal: 'ESP', localitat: '', provincia: '', municipi: '', cp: '',
}

const DOC_LABELS: Record<string, string> = { D: 'DNI', P: 'Pasaporte', N: 'NIE', O: 'Otro' }

function normalizeAscii(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x00-\x7F]/g, '').toUpperCase()
}

function toYMD(dateStr: string) {
  return dateStr.replace(/-/g, '')
}

function buildTxt(guests: GuestForm[], airbnbCode: string, checkIn: string, checkOut: string, mossosId: string, estName: string): string {
  const today = new Date()
  const fconf = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`
  const entFmt = toYMD(checkIn)
  const salFmt = toYMD(checkOut)
  const tipusContracte = entFmt >= fconf ? 'R' : 'C'
  const contractDate = entFmt <= fconf ? entFmt : fconf

  const header = ['1', mossosId, estName, fconf, '0900', String(guests.length), 'V24'].join('|')

  const lines = guests.map(g => {
    const isEsp = g.pais_postal === 'ESP'
    return [
      '2',
      g.tipo === 'D' ? normalizeAscii(g.numdoc) : '',
      g.tipo !== 'D' ? normalizeAscii(g.numdoc) : '',
      g.tipo,
      g.exp.replace(/-/g, ''),
      normalizeAscii(g.ap1),
      normalizeAscii(g.ap2),
      normalizeAscii(g.nom),
      g.sexe,
      g.naix.replace(/-/g, ''),
      g.nac.toUpperCase(),
      entFmt,
      '1500',
      salFmt,
      '1100',
      contractDate,
      tipusContracte,
      airbnbCode.toUpperCase(),
      String(guests.length),
      '1',
      'N',
      'PLATF',
      g.tel.replace(/[^0-9]/g, ''),
      '',
      g.email,
      g.tipo === 'D' ? normalizeAscii(g.soporte) : '',
      normalizeAscii(g.adreca),
      isEsp ? g.provincia : '',
      isEsp ? g.municipi : '',
      isEsp ? '' : normalizeAscii(g.localitat),
      g.pais_postal.toUpperCase(),
      g.cp,
    ].join('|')
  })

  return [header, ...lines].join('\r\n')
}

export default function ManualCheckinForm({ reservationId, airbnbCode, checkIn, checkOut, totalGuests, mossosId, establishmentName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [guests, setGuests] = useState<GuestForm[]>([{ ...EMPTY_GUEST }])

  const g = guests[currentIdx]
  const setG = (patch: Partial<GuestForm>) => {
    setGuests(prev => prev.map((gg, i) => i === currentIdx ? { ...gg, ...patch } : gg))
  }

  function addGuest() {
    setGuests(prev => [...prev, { ...EMPTY_GUEST }])
    setCurrentIdx(guests.length)
  }

  function removeGuest(idx: number) {
    if (guests.length === 1) return
    setGuests(prev => prev.filter((_, i) => i !== idx))
    setCurrentIdx(Math.max(0, idx - 1))
  }

  async function handleSubmit() {
    for (const [i, gg] of guests.entries()) {
      if (!gg.numdoc || !gg.ap1 || !gg.nom || !gg.naix || !gg.nac) {
        setError(`Huésped ${i + 1}: faltan campos obligatorios (doc, apellido, nombre, nacimiento, nacionalidad)`)
        return
      }
    }
    setSaving(true)
    setError('')
    try {
      const txt = buildTxt(guests, airbnbCode, checkIn, checkOut, mossosId, establishmentName)
      const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
      const fname = `${mossosId}.${seq}.txt`

      const guestData = guests.map(gg => ({
        tipo: gg.tipo,
        numdoc: gg.tipo === 'D' ? gg.numdoc : gg.numdoc,
        expedicion: gg.exp.replace(/-/g, ''),
        ap1: normalizeAscii(gg.ap1),
        ap2: normalizeAscii(gg.ap2),
        nom: normalizeAscii(gg.nom),
        sexe: gg.sexe,
        naix: gg.naix.replace(/-/g, ''),
        nac: gg.nac.toUpperCase(),
        menor: 'N',
        soporte_dni: gg.tipo === 'D' ? gg.soporte : '',
        entrada: toYMD(checkIn),
        hora_entrada: '1500',
        salida: toYMD(checkOut),
        hora_salida: '1100',
        airbnb_code_txt: airbnbCode.toUpperCase(),
        num_viajeros: String(guests.length),
        num_habitaciones: '1',
        tipo_pago: 'PLATF',
        tel: gg.tel.replace(/[^0-9]/g, ''),
        email: gg.email,
        direccion: normalizeAscii(gg.adreca),
        provincia: gg.pais_postal === 'ESP' ? gg.provincia : '',
        municipio: gg.pais_postal === 'ESP' ? gg.municipi : '',
        localidad: gg.pais_postal !== 'ESP' ? normalizeAscii(gg.localitat) : '',
        pais_residencia: gg.pais_postal.toUpperCase(),
        cp: gg.cp,
      }))

      const res = await fetch('/api/mossos/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ airbnbCode, guestData, txtContent: txt, txtFilename: fname }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Error')
      setOpen(false)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const isEsp = g.pais_postal === 'ESP'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Registrar huéspedes
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-slate-900">Registrar huéspedes</h2>
                <p className="text-xs text-slate-400 mt-0.5">{airbnbCode} · {checkIn} → {checkOut}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Guest tabs */}
            {guests.length > 1 && (
              <div className="flex gap-1 px-5 pt-3">
                {guests.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${i === currentIdx ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Huésped {i + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

              {/* Document */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Tipo doc.</label>
                  <select value={g.tipo} onChange={e => setG({ tipo: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400">
                    {Object.entries(DOC_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Número <span className="text-red-500">*</span></label>
                  <input value={g.numdoc} onChange={e => setG({ numdoc: e.target.value.toUpperCase() })}
                    placeholder={g.tipo === 'D' ? '12345678A' : g.tipo === 'P' ? 'AB123456' : ''}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>

              {g.tipo === 'D' && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nº soporte DNI</label>
                  <input value={g.soporte} onChange={e => setG({ soporte: e.target.value.toUpperCase() })}
                    placeholder="AAA123456" maxLength={9}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Fecha expedición doc.</label>
                <input type="date" value={g.exp} onChange={e => setG({ exp: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Primer apellido <span className="text-red-500">*</span></label>
                  <input value={g.ap1} onChange={e => setG({ ap1: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Segundo apellido</label>
                  <input value={g.ap2} onChange={e => setG({ ap2: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nombre <span className="text-red-500">*</span></label>
                <input value={g.nom} onChange={e => setG({ nom: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Sexo</label>
                  <select value={g.sexe} onChange={e => setG({ sexe: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">F. nacimiento <span className="text-red-500">*</span></label>
                  <input type="date" value={g.naix} onChange={e => setG({ naix: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nacionalidad <span className="text-red-500">*</span></label>
                  <input value={g.nac} onChange={e => setG({ nac: e.target.value.toUpperCase() })}
                    placeholder="ESP" maxLength={3}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Teléfono</label>
                  <input value={g.tel} onChange={e => setG({ tel: e.target.value })} placeholder="+34..."
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                  <input type="email" value={g.email} onChange={e => setG({ email: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Dirección</label>
                <input value={g.adreca} onChange={e => setG({ adreca: e.target.value })} placeholder="Calle, número"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">País residencia</label>
                  <input value={g.pais_postal} onChange={e => setG({ pais_postal: e.target.value.toUpperCase() })}
                    placeholder="ESP" maxLength={3}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Código postal</label>
                  <input value={g.cp} onChange={e => setG({ cp: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>

              {isEsp ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Cód. provincia INE</label>
                    <input value={g.provincia} onChange={e => setG({ provincia: e.target.value })} placeholder="08"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Cód. municipio INE</label>
                    <input value={g.municipi} onChange={e => setG({ municipi: e.target.value })} placeholder="080193"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Localidad</label>
                  <input value={g.localitat} onChange={e => setG({ localitat: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              )}

              {/* Add/remove guest */}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={addGuest}
                  className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Añadir huésped
                </button>
                {guests.length > 1 && (
                  <button type="button" onClick={() => removeGuest(currentIdx)}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium ml-3">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar este huésped
                  </button>
                )}
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors">
                {saving ? 'Guardando...' : `Guardar ${guests.length > 1 ? `${guests.length} huéspedes` : 'huésped'}`}
              </button>
              <button onClick={() => setOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
