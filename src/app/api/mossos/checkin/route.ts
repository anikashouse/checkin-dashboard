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

export async function PATCH(request: NextRequest) {
  try {
    const { reservationId } = await request.json()
    if (!reservationId) {
      return NextResponse.json({ error: 'reservationId required' }, { status: 400 })
    }
    const { error } = await db
      .from('checkin_records')
      .update({ tax_payment_method: 'cash_paid', updated_at: new Date().toISOString() })
      .eq('reservation_id', reservationId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { airbnbCode, guestData, txtContent, txtFilename, taxPaymentMethod } = body

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

    // Check if a record already exists for this reservation
    const { data: existing } = await db
      .from('checkin_records')
      .select('id')
      .eq('reservation_id', reservation.id)
      .maybeSingle()

    let error
    if (existing) {
      // Always overwrite txt_content so the send route uses the latest file
      ;({ error } = await db
        .from('checkin_records')
        .update({
          guest_data: guestData ?? null,
          txt_content: txtContent ?? null,
          txt_filename: txtFilename ?? null,
          form_complete: true,
          tax_payment_method: taxPaymentMethod ?? null,
          updated_at: now,
        })
        .eq('reservation_id', reservation.id))
    } else {
      ;({ error } = await db.from('checkin_records').insert({
        id: crypto.randomUUID(),
        reservation_id: reservation.id,
        property_id: reservation.property_id,
        airbnb_code: airbnbCode.toUpperCase(),
        guest_data: guestData ?? null,
        txt_content: txtContent ?? null,
        txt_filename: txtFilename ?? null,
        form_complete: true,
        tax_payment_method: taxPaymentMethod ?? null,
        completed_at: now,
        updated_at: now,
      }))
    }

    if (error) {
      console.error('[mossos/checkin] db error:', error)
      return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
    }

    return NextResponse.json({ ok: true }, { headers: corsHeaders })
  } catch (err) {
    console.error('[mossos/checkin] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders })
  }
}
