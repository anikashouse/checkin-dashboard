import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, supabase } from '@/lib/supabase'
import { parseIcalText } from '@/lib/db'

const db = supabaseAdmin ?? supabase

async function fetchIcal(ical_url: string): Promise<string | null> {
  try {
    const res = await fetch(ical_url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    })
    if (!res.ok) return null
    const text = await res.text()
    return text.includes('BEGIN:VCALENDAR') ? text : null
  } catch {
    return null
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: properties } = await db
      .from('properties')
      .select('*')
      .eq('user_id', userId)

    if (!properties?.length) {
      return NextResponse.json({ message: 'No properties found', results: [] })
    }

    const { data: allReservations } = await db.from('reservations').select('airbnb_code')
    const globalCodes = new Set(allReservations?.map((r: any) => r.airbnb_code) || [])

    const results = []

    for (const prop of properties) {
      if (!prop.ical_url) {
        results.push({ name: prop.name, error: 'No iCal URL' })
        continue
      }

      const icalText = await fetchIcal(prop.ical_url)
      if (!icalText) {
        results.push({ name: prop.name, error: 'Failed to fetch iCal' })
        continue
      }

      const parsedEvents = parseIcalText(icalText)
      const { data: existingRes } = await db
        .from('reservations')
        .select('*')
        .eq('property_id', prop.id)

      let inserted = 0, updated = 0

      for (const event of parsedEvents) {
        const existing = existingRes?.find((r: any) => r.airbnb_code === event.airbnbCode)

        if (existing) {
          if (existing.checked_in_at) continue
          const { error } = await db.from('reservations').update({
            guest_name: event.guestName,
            check_in: event.checkIn,
            check_out: event.checkOut,
            nights: event.nights,
            guests: event.guests,
            tel_suffix: event.tel_suffix || null,
          }).eq('id', existing.id)
          if (!error) updated++
        } else if (!globalCodes.has(event.airbnbCode)) {
          const { error } = await db.from('reservations').insert({
            id: `${prop.id}-${event.airbnbCode}`,
            property_id: prop.id,
            airbnb_code: event.airbnbCode,
            guest_name: event.guestName,
            check_in: event.checkIn,
            check_out: event.checkOut,
            nights: event.nights,
            guests: event.guests,
            tel_suffix: event.tel_suffix || null,
          })
          if (!error) { inserted++; globalCodes.add(event.airbnbCode) }
        } else {
          // Exists in a different property — reassign (iCal was swapped)
          const { error } = await db.from('reservations').update({
            property_id: prop.id,
            guest_name: event.guestName,
            check_in: event.checkIn,
            check_out: event.checkOut,
            nights: event.nights,
            guests: event.guests,
            tel_suffix: event.tel_suffix || null,
          }).eq('airbnb_code', event.airbnbCode).neq('property_id', prop.id)
          if (!error) updated++
        }
      }

      results.push({ name: prop.name, inserted, updated, total: parsedEvents.length })
    }

    const totalInserted = results.reduce((s, r) => s + (r.inserted ?? 0), 0)
    const totalUpdated  = results.reduce((s, r) => s + (r.updated  ?? 0), 0)

    return NextResponse.json({
      message: `Sync completo: ${totalInserted} nuevas, ${totalUpdated} actualizadas`,
      results,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
