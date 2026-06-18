import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, supabase } from '@/lib/supabase'
import { generateMossosTxt, validateGuests } from '@/lib/mossos'
import type { GuestData } from '@/lib/types'

const db = supabaseAdmin ?? supabase

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reservationId, guestData }: { reservationId: string; guestData: GuestData[] } = await request.json()
  if (!reservationId || !guestData?.length) {
    return NextResponse.json({ error: 'reservationId and guestData required' }, { status: 400 })
  }

  const { data: res } = await db
    .from('reservations')
    .select('airbnb_code, property_id')
    .eq('id', reservationId)
    .maybeSingle()
  if (!res) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })

  const { data: prop } = await db
    .from('properties')
    .select('mossos_id, name')
    .eq('id', res.property_id)
    .maybeSingle()

  const mossosId = prop?.mossos_id || 'ID50044239'
  const estName  = "ANIKA'S HOUSE"

  const validationErrors = validateGuests(guestData)
  if (validationErrors.length > 0) {
    return NextResponse.json({ error: validationErrors.join(' | ') }, { status: 422 })
  }

  const txtContent = generateMossosTxt(guestData, mossosId, estName)
  const seq        = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
  const txtFilename = `${mossosId}.${seq}.txt`

  const { error } = await db
    .from('checkin_records')
    .update({
      guest_data:   guestData,
      txt_content:  txtContent,
      txt_filename: txtFilename,
      mossos_sent:  false,
      updated_at:   new Date().toISOString(),
    })
    .eq('reservation_id', reservationId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
