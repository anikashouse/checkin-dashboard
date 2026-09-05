import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'
import { syncIcalForProperties } from '@/lib/syncIcal'

const db = supabaseAdmin ?? supabase

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

// Upcoming reservations for the guest check-in page. Replaces the third-party CORS
// proxies it used to hit the Airbnb iCal with directly — those are all dead, and this
// also keeps the tokenised iCal URLs off the public page.
export async function GET(request: NextRequest) {
  const propertyId = request.nextUrl.searchParams.get('property')
  if (!propertyId) {
    return NextResponse.json({ error: 'property required' }, { status: 400, headers: CORS })
  }

  const { data: prop } = await db
    .from('properties')
    .select('id, name')
    .eq('id', propertyId)
    .maybeSingle()

  if (!prop) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404, headers: CORS })
  }

  // Pull the feed first so a booking made minutes ago is already selectable.
  await syncIcalForProperties([propertyId]).catch(() => {})

  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())

  const horizon = new Date()
  horizon.setDate(horizon.getDate() + 20)
  const horizonStr = horizon.toISOString().slice(0, 10)

  const { data, error } = await db
    .from('reservations')
    .select('airbnb_code, check_in, check_out, nights, guests, tel_suffix')
    .eq('property_id', propertyId)
    .gte('check_out', today)
    .lte('check_in', horizonStr)
    .order('check_in', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS })
  }

  return NextResponse.json(
    (data ?? []).map((r: any) => ({
      codigo: r.airbnb_code,
      entrada: r.check_in,
      salida: r.check_out,
      noches: r.nights,
      huespedes: r.guests,
      tel_suffix: r.tel_suffix,
    })),
    { headers: CORS }
  )
}
