import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { parseIcalText } from '@/lib/db'

async function fetchIcal(ical_url: string): Promise<string | null> {
  try {
    const res = await fetch(ical_url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!res.ok) {
      console.warn(`[iCal Fetch] Failed: HTTP ${res.status}`)
      return null
    }

    const text = await res.text()
    if (!text.includes('BEGIN:VCALENDAR')) {
      console.warn('[iCal Fetch] Invalid iCal format')
      return null
    }

    return text
  } catch (err) {
    console.warn('[iCal Fetch] Error:', err)
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
        propertyId,
        error: 'No iCal URL configured'
      })
    }

    // Fetch iCal
    const icalText = await fetchIcal(prop.ical_url)
    if (!icalText) {
      return NextResponse.json({
        propertyId,
        error: 'Failed to fetch iCal'
      })
    }

    // Parse events
    let events = []
    try {
      events = parseIcalText(icalText)
    } catch (err) {
      return NextResponse.json({
        propertyId,
        error: 'Error parsing iCal: ' + (err instanceof Error ? err.message : 'Unknown'),
        ical_url: prop.ical_url?.substring(0, 80) + '...'
      })
    }

    return NextResponse.json({
      propertyId,
      success: true,
      name: prop.name,
      ical_url: prop.ical_url?.substring(0, 80) + '...',
      reservationCount: events.length,
      reservations: events.slice(0, 5).map(e => ({
        code: e.airbnbCode,
        checkIn: e.checkIn,
        checkOut: e.checkOut,
        guests: e.guests
      })),
      hasMore: events.length > 5
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
