import type { GuestData } from './types'

function norm(s?: string): string {
  if (!s) return ''
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x00-\x7F]/g, '').toUpperCase()
}

export function generateMossosTxt(guests: GuestData[], mossosId: string, estName: string): string {
  const today = new Date()
  const fconf = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`

  const header = ['1', mossosId, estName, fconf, '0900', String(guests.length), 'V24'].join('|')

  const lines = guests.map(g => {
    const tipo = g.tipo || 'P'
    const pais = (g.pais_residencia || 'ESP').toUpperCase()
    const isEsp = pais === 'ESP'
    const entFmt = (g.entrada || '').replace(/-/g, '')
    const salFmt = (g.salida || '').replace(/-/g, '')
    const tipusContracte = g.tipo_contrato || (entFmt >= fconf ? 'R' : 'C')
    const contractDate = g.fecha_contrato || (entFmt <= fconf ? entFmt : fconf)

    return [
      '2',
      tipo === 'D' ? norm(g.numdoc) : '',
      tipo !== 'D' ? norm(g.numdoc) : '',
      tipo,
      (g.expedicion || '').replace(/-/g, ''),
      norm(g.ap1),
      norm(g.ap2),
      norm(g.nom),
      g.sexe || '',
      (g.naix || '').replace(/-/g, ''),
      (g.nac || 'ESP').toUpperCase(),
      entFmt,
      g.hora_entrada || '1500',
      salFmt,
      g.hora_salida || '1100',
      contractDate,
      tipusContracte,
      (g.airbnb_code_txt || '').toUpperCase(),
      g.num_viajeros || String(guests.length),
      g.num_habitaciones || '1',
      g.menor || 'N',
      g.tipo_pago || 'PLATF',
      (g.tel || '').replace(/[^0-9]/g, '').slice(0, 20),
      '',
      (g.email || '').toLowerCase(),
      tipo === 'D' ? norm(g.soporte_dni) : '',
      norm(g.direccion),
      isEsp ? (g.provincia || '') : '',
      isEsp ? (g.municipio || '') : '',
      isEsp ? '' : norm(g.localidad),
      pais,
      g.cp || '',
    ].join('|').replace(/\|+$/, '')
  })

  return [header, ...lines].join('\r\n')
}
