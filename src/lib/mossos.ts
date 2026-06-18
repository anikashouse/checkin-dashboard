import type { GuestData } from './types'

function norm(s?: string): string {
  if (!s) return ''
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x00-\x7F]/g, '').toUpperCase()
}

const VALID_TIPO_DOC  = ['D', 'N', 'P', 'O']
const VALID_SEXE      = ['M', 'F', 'O']
const VALID_PAGAMENT  = ['DESTI', 'EFECT', 'MOVIL', 'OTRO', 'PLATF', 'TARJT', 'TRANS', 'TREG']
const VALID_CONTRACTE = ['C', 'R']

export function validateGuests(guests: GuestData[]): string[] {
  const errors: string[] = []

  guests.forEach((g, i) => {
    const lbl = guests.length > 1 ? `Huésped ${i + 1}: ` : ''
    const tipo = g.tipo || 'P'

    if (!VALID_TIPO_DOC.includes(tipo))
      errors.push(`${lbl}Tipo de documento inválido (${tipo}). Válidos: D/N/P/O`)

    if (!g.numdoc?.trim())
      errors.push(`${lbl}Número de documento obligatorio`)

    if (!g.ap1?.trim())
      errors.push(`${lbl}Primer apellido obligatorio`)

    if (tipo === 'D' && !g.ap2?.trim())
      errors.push(`${lbl}Segundo apellido obligatorio para DNI`)

    if (!g.nom?.trim())
      errors.push(`${lbl}Nombre obligatorio`)

    if (g.sexe && !VALID_SEXE.includes(g.sexe))
      errors.push(`${lbl}Sexo inválido (${g.sexe}). Válidos: M/F/O`)

    // Número de soporte: obligatorio y exactamente 9 chars para DNI y NIE
    if (tipo === 'D' || tipo === 'N') {
      const sop = norm(g.soporte_dni || '').replace(/\s/g, '')
      if (!sop)
        errors.push(`${lbl}Número de soporte obligatorio para ${tipo === 'D' ? 'DNI' : 'NIE'}`)
      else if (sop.length !== 9)
        errors.push(`${lbl}Número de soporte debe ser exactamente 9 caracteres (actual: ${sop.length})`)
    }

    if (!g.entrada) errors.push(`${lbl}Fecha de entrada obligatoria`)
    if (!g.salida)  errors.push(`${lbl}Fecha de salida obligatoria`)

    if (g.tipo_contrato && !VALID_CONTRACTE.includes(g.tipo_contrato))
      errors.push(`${lbl}Tipo de contrato inválido (${g.tipo_contrato}). Válidos: C/R`)

    if (g.tipo_pago && !VALID_PAGAMENT.includes(g.tipo_pago))
      errors.push(`${lbl}Tipo de pago inválido (${g.tipo_pago})`)

    const tel   = (g.tel   || '').replace(/[^0-9]/g, '')
    const email = (g.email || '').trim()
    if (!tel && !email)
      errors.push(`${lbl}Teléfono o email obligatorio`)

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.push(`${lbl}Email inválido: ${email}`)

    // Dirección obligatoria para Contracte En Curs (check-in ya iniciado)
    const entFmt = (g.entrada || '').replace(/-/g, '')
    const spParts = new Intl.DateTimeFormat('en', {
      timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date())
    const gd = (t: string) => spParts.find(p => p.type === t)?.value ?? '00'
    const todayFmt = `${gd('year')}${gd('month')}${gd('day')}`
    const tipusContracte = g.tipo_contrato || (entFmt >= todayFmt ? 'R' : 'C')
    if (tipusContracte === 'C' && !g.direccion?.trim())
      errors.push(`${lbl}Dirección postal obligatoria (check-in en curso)`)
  })

  return errors
}

export function generateMossosTxt(guests: GuestData[], mossosId: string, estName: string): string {
  const spainParts = new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Madrid',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date())
  const sp = (t: string) => spainParts.find(p => p.type === t)?.value ?? '00'
  const fconf = `${sp('year')}${sp('month')}${sp('day')}`
  const hconf = sp('hour').replace('24', '00') + sp('minute')

  const header = ['1', mossosId, estName, fconf, hconf, String(guests.length), 'V24'].join('|')

  const lines = guests.map(g => {
    const tipo  = g.tipo || 'P'
    const pais  = (g.pais_residencia || 'ESP').toUpperCase()
    const isEsp = pais === 'ESP'
    const entFmt = (g.entrada || '').replace(/-/g, '')
    const salFmt = (g.salida  || '').replace(/-/g, '')
    const tipusContracte = g.tipo_contrato || (entFmt >= fconf ? 'R' : 'C')
    const contractDate   = g.fecha_contrato || (entFmt <= fconf ? entFmt : fconf)

    // Normalize doc — strip % (forbidden), then split into spanish/foreign buckets with max lengths
    const numdocNorm = norm(g.numdoc).replace(/%/g, '')
    const docEsp  = tipo === 'D' ? numdocNorm.slice(0, 11) : ''
    const docEstr = tipo !== 'D' ? numdocNorm.slice(0, 14) : ''

    // Soporte: mandatory for D (DNI) and N (NIE), exactly 9 chars per spec
    const soporteRaw = (tipo === 'D' || tipo === 'N')
      ? norm(g.soporte_dni || '').replace(/\s/g, '') : ''
    const soporte = soporteRaw.slice(0, 9)

    // Text fields — normalize to ASCII uppercase and truncate to spec max lengths
    const ap1      = norm(g.ap1).slice(0, 30)
    const ap2      = norm(g.ap2).slice(0, 30)
    const nom      = norm(g.nom).slice(0, 30)
    const direccion = norm(g.direccion).slice(0, 100)
    const localitat = isEsp ? '' : norm(g.localidad).slice(0, 100)
    const email     = (g.email || '').trim().toLowerCase().slice(0, 100)
    const tel       = (g.tel   || '').replace(/[^0-9]/g, '').slice(0, 20)
    const numContracte = (g.airbnb_code_txt || '').toUpperCase().slice(0, 20)
    const cp        = (g.cp || '').slice(0, 20)

    // Pago: default PLATF if value is not in the allowed set
    const tipoPago = VALID_PAGAMENT.includes(g.tipo_pago || '') ? g.tipo_pago! : 'PLATF'

    return [
      '2',
      docEsp,                                     // F2  número doc espanyol (max 11)
      docEstr,                                    // F3  número doc estranger (max 14)
      tipo,                                       // F4  tipus document (D/N/P/O)
      (g.expedicion || '').replace(/-/g, ''),     // F5  data expedició
      ap1,                                        // F6  primer cognom (max 30, mandatory)
      ap2,                                        // F7  segon cognom (max 30)
      nom,                                        // F8  nom (max 30, mandatory)
      g.sexe || '',                               // F9  sexe (M/F/O)
      (g.naix || '').replace(/-/g, ''),           // F10 data naixement
      (g.nac || 'ESP').toUpperCase(),             // F11 país nacionalitat (ISO alfa-3)
      entFmt,                                     // F12 data entrada
      g.hora_entrada || '1500',                   // F13 hora entrada (HHmm)
      salFmt,                                     // F14 data sortida
      g.hora_salida || '1100',                    // F15 hora sortida (HHmm)
      contractDate,                               // F16 data contracte
      tipusContracte,                             // F17 tipus contracte (C/R)
      numContracte,                               // F18 número contracte (max 20)
      g.num_viajeros || String(guests.length),    // F19 número viatgers
      g.num_habitaciones || '1',                  // F20 número habitacions
      g.menor || 'N',                             // F21 internet? (S/N)
      tipoPago,                                   // F22 tipus pagament
      tel,                                        // F23 telèfon (max 20, phone OR email mandatory)
      '',                                         // F24 relació de parentesc
      email,                                      // F25 email (max 100, phone OR email mandatory)
      soporte,                                    // F26 número suport doc (9 chars, D and N types)
      direccion,                                  // F27 direcció postal (max 100)
      isEsp ? (g.provincia || '') : '',           // F28 província postal (INE 2 digits, Spain only)
      isEsp ? (g.municipio || '') : '',           // F29 municipi postal (INE 6 digits, Spain only)
      localitat,                                  // F30 localitat postal (max 100, non-Spain)
      pais,                                       // F31 país postal (ISO alfa-3)
      cp,                                         // F32 codi postal (max 20)
    ].join('|').replace(/\|+$/, '')
  })

  return [header, ...lines].join('\r\n')
}
