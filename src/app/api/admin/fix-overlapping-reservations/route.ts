import { NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'

const db = supabaseAdmin ?? supabase

const isRealCode = (code: string) => /^HM[A-Z0-9]+$/.test(code)

export async function POST() {
  try {
    const { data: all, error } = await db
      .from('reservations')
      .select('id, property_id, airbnb_code, check_in, check_out, checked_in_at')
      .order('check_in')

    if (error) throw error

    const { data: checkinRecords } = await db
      .from('checkin_records')
      .select('reservation_id')

    const hasCheckin = new Set((checkinRecords ?? []).map((r: any) => r.reservation_id))

    // Group by property
    const byProperty = new Map<string, typeof all>()
    for (const r of all ?? []) {
      if (!byProperty.has(r.property_id)) byProperty.set(r.property_id, [])
      byProperty.get(r.property_id)!.push(r)
    }

    const toDelete: string[] = []
    const report: Array<{ kept: string; deleted: string; property: string }> = []

    for (const [propId, reservations] of byProperty) {
      for (let i = 0; i < reservations.length; i++) {
        for (let j = i + 1; j < reservations.length; j++) {
          const a = reservations[i]
          const b = reservations[j]
          const overlap = a.check_in < b.check_out && a.check_out > b.check_in
          if (!overlap) continue
          if (toDelete.includes(a.id) || toDelete.includes(b.id)) continue

          // Keep: prefer checked_in > checkin record > real HM code > a (first in sort order)
          let keep = a, discard = b
          if (b.checked_in_at && !a.checked_in_at) { keep = b; discard = a }
          else if (hasCheckin.has(b.id) && !hasCheckin.has(a.id)) { keep = b; discard = a }
          else if (isRealCode(b.airbnb_code) && !isRealCode(a.airbnb_code)) { keep = b; discard = a }

          toDelete.push(discard.id)
          report.push({ property: propId, kept: keep.airbnb_code, deleted: discard.airbnb_code })
        }
      }
    }

    if (toDelete.length === 0) {
      return NextResponse.json({ message: 'No overlapping reservations found', deleted: 0 })
    }

    const { error: delError } = await db
      .from('reservations')
      .delete()
      .in('id', toDelete)

    if (delError) throw delError

    return NextResponse.json({ message: `Deleted ${toDelete.length} overlapping reservation(s)`, deleted: toDelete.length, report })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
