import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'

const db = supabaseAdmin ?? supabase

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { airbnbCode, guestData, txtContent, txtFilename } = body

    if (!airbnbCode) {
      return NextResponse.json({ error: 'airbnbCode required' }, { status: 400, headers: corsHeaders })
    }

    const { data: reservation } = await db
      .from('reservations')
      .select('id, property_id')
      .ilike('airbnb_code', airbnbCode)
      .maybeSingle()

    if (!reservation) {
      return NextResponse.json({ error: `Reservation not found: ${airbnbCode}` }, { status: 404, headers: corsHeaders })
    }

    const now = new Date().toISOString()
    const { error } = await db.from('checkin_records').upsert({
      id: crypto.randomUUID(),
      reservation_id: reservation.id,
      property_id: reservation.property_id,
      airbnb_code: airbnbCode.toUpperCase(),
      guest_data: guestData ?? null,
      txt_content: txtContent ?? null,
      txt_filename: txtFilename ?? null,
      form_complete: true,
      completed_at: now,
      updated_at: now,
    }, { onConflict: 'reservation_id' })

    if (error) {
      console.error('[mossos/checkin] upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
    }

    return NextResponse.json({ ok: true }, { headers: corsHeaders })
  } catch (err) {
    console.error('[mossos/checkin] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders })
  }
}
