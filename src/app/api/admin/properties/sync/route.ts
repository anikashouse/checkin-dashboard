import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { parseIcalText } from '@/lib/db'

async function fetchIcal(icalUrl: string): Promise<string | null> {
  try {
    const res = await fetch(icalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!res.ok) return null
    const text = await res.text()
    return text.includes('BEGIN:VCALENDAR') ? text : null
  } catch (err) {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { propertyId } = body

    // Get property
    const { data: prop, error: propError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single()

    if (propError || !prop) throw new Error('Property not found')

    if (!prop.ical_url) {
      return NextResponse.json({
        success: false,
        error: 'No iCal URL configured'
      })
    }

    console.log(`[Sync] Starting sync for ${prop.name}`)

    // Fetch and parse iCal
    const icalText = await fetchIcal(prop.ical_url)
    if (!icalText) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch iCal'
      })
    }

    const parsedEvents = parseIcalText(icalText)

    // Get existing reservations for this property
    const { data: existingRes } = await supabase
      .from('reservations')
      .select('*')
      .eq('property_id', propertyId)

    // Get all reservations globally for deduplication
    const { data: allReservations } = await supabase
      .from('reservations')
      .select('airbnb_code')

    const globalCodes = new Set(allReservations?.map(r => r.airbnb_code) || [])

    let inserted = 0
    let updated = 0

    // Sync each event
    for (const event of parsedEvents) {
      const existing = existingRes?.find(r => r.airbnb_code === event.airbnbCode)

      if (existing) {
        // Skip if already checked in
        if (existing.checked_in_at) continue

        // Update
        const { error } = await supabase
          .from('reservations')
          .update({
            guest_name: event.guestName,
            check_in: event.checkIn,
            check_out: event.checkOut,
            nights: event.nights,
            guests: event.guests,
            tel_suffix: event.tel_suffix || null,
          })
          .eq('id', existing.id)

        if (!error) updated++
      } else if (!globalCodes.has(event.airbnbCode)) {
        // Insert only if not duplicate in any property
        const { error } = await supabase.from('reservations').insert({
          id: `${propertyId}-${event.airbnbCode}`,
          property_id: propertyId,
          airbnb_code: event.airbnbCode,
          guest_name: event.guestName,
          check_in: event.checkIn,
          check_out: event.checkOut,
          nights: event.nights,
          guests: event.guests,
          tel_suffix: event.tel_suffix || null,
        })

        if (!error) inserted++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${prop.name}: ${inserted} inserted, ${updated} updated`,
      stats: {
        propertyId,
        propertyName: prop.name,
        eventsFound: parsedEvents.length,
        inserted,
        updated,
        skipped: parsedEvents.length - inserted - updated
      }
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
