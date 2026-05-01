import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, supabase } from '@/lib/supabase'

const db = supabaseAdmin ?? supabase

function parseTxtGuests(txt: string) {
  return txt.split(/\r?\n/).filter(Boolean).flatMap(line => {
    const f = line.split('|')
    if (f[0] !== '2') return []
    return [{
      tipo:         f[3] ?? '',
      numdoc:       f[2] ?? '',
      suport:       f[4] ?? '',
      ap1:          f[5] ?? '',
      ap2:          f[6] ?? '',
      nom:          f[7] ?? '',
      sexe:         f[8] ?? '',
      naix:         f[9] ?? '',
      nac:          f[10] ?? '',
      entrada:      f[11] ?? '',
      hora_entrada: f[12] ?? '',
      salida:       f[13] ?? '',
      hora_salida:  f[14] ?? '',
      expedicion:   f[15] ?? '',
      soporte:      f[16] ?? '',
      tel:          f[22] ?? '',
      email:        f[24] ?? '',
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
