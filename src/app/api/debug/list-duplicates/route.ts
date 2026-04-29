import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Get all reservations grouped by airbnb_code
    const { data, error } = await supabase
      .from('reservations')
      .select('airbnb_code, property_id, guest_name, check_in, check_out')
      .order('airbnb_code')

    if (error) throw error

    // Find duplicates (same code in multiple properties)
    const codeMap = new Map<string, Array<{property_id: string, guest_name: string, check_in: string, check_out: string}>>()

    for (const res of data || []) {
      if (!codeMap.has(res.airbnb_code)) {
        codeMap.set(res.airbnb_code, [])
      }
      codeMap.get(res.airbnb_code)!.push({
        property_id: res.property_id,
        guest_name: res.guest_name,
        check_in: res.check_in,
        check_out: res.check_out
      })
    }

    const duplicates = Array.from(codeMap.entries())
      .filter(([_, reservations]) => reservations.length > 1)
      .map(([code, reservations]) => ({
        code,
        count: reservations.length,
        reservations
      }))

    return NextResponse.json({
      totalDuplicates: duplicates.length,
      duplicates
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
