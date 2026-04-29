import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Get all reservations
    const { data: res } = await supabase
      .from('reservations')
      .select('id, airbnb_code, check_in, check_out, property_id')

    // Get all properties with iCal URLs
    const { data: props } = await supabase
      .from('properties')
      .select('id, name, ical_url')

    return NextResponse.json({
      reservations: res,
      properties: props,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}
