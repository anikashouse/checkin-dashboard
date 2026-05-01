import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, supabase } from '@/lib/supabase'

const db = supabaseAdmin ?? supabase

function parseTxtGuests(txt: string) {
  return txt.split(/\r?\n/).filter(Boolean).flatMap(line => {
    const f = line.split('|')
    if (f[0] !== '2') return []
    const trim = (v?: string) => v?.trim() || undefined
    return [{
      nom:              trim(f[7]),
      ap1:              trim(f[5]),
      ap2:              trim(f[6]),
      sexe:             trim(f[8]),
      naix:             trim(f[9]),
      nac:              trim(f[10]),
      menor:            trim(f[20]),
      tipo:             trim(f[3]),
      numdoc:           trim(f[1]) || trim(f[2]),
      expedicion:       trim(f[4]),
      soporte_dni:      trim(f[25]),
      entrada:          trim(f[11]),
      hora_entrada:     trim(f[12]),
      salida:           trim(f[13]),
      hora_salida:      trim(f[14]),
      fecha_contrato:   trim(f[15]),
      tipo_contrato:    trim(f[16]),
      airbnb_code_txt:  trim(f[17]),
      num_viajeros:     trim(f[18]),
      num_habitaciones: trim(f[19]),
      tipo_pago:        trim(f[21]),
      tel:              trim(f[22]),
      email:            trim(f[24]),
      direccion:        trim(f[26]),
      provincia:        trim(f[27]),
      municipio:        trim(f[28]),
      localidad:        trim(f[29]),
      pais_residencia:  trim(f[30]),
      cp:               trim(f[31]),
    }]
  })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const reservationId = formData.get('reservationId') as string
  const file = formData.get('file') as File

  if (!reservationId || !file) {
    return NextResponse.json({ error: 'reservationId and file required' }, { status: 400 })
  }

  const txtContent = await file.text()
  const guestData = parseTxtGuests(txtContent)

  const { data: res } = await db.from('reservations').select('property_id, airbnb_code').eq('id', reservationId).maybeSingle()
  if (!res) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })

  const { error } = await db.from('checkin_records').upsert({
    id: crypto.randomUUID(),
    reservation_id: reservationId,
    property_id: res.property_id,
    airbnb_code: res.airbnb_code,
    txt_content: txtContent,
    txt_filename: file.name,
    guest_data: guestData.length > 0 ? guestData : null,
    form_complete: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'reservation_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
