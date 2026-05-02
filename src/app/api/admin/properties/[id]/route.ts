import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { parseIcalText } from '@/lib/db'

const db = supabaseAdmin ?? supabase

async function syncPropertyReservations(propertyId: string, icalUrl: string) {
  try {
    const res = await fetch(icalUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    })
    if (!res.ok) return
    const text = await res.text()
    if (!text.includes('BEGIN:VCALENDAR')) return

    const events = parseIcalText(text)
    const { data: existingForProp } = await db.from('reservations').select('*').eq('property_id', propertyId)
    const { data: allRes } = await db.from('reservations').select('airbnb_code, property_id, id')
    const globalMap = new Map((allRes ?? []).map((r: any) => [r.airbnb_code, r]))

    for (const event of events) {
      const existing = existingForProp?.find((r: any) => r.airbnb_code === event.airbnbCode)
      if (existing) {
        if (!existing.checked_in_at) {
          await db.from('reservations').update({
            guest_name: event.guestName, check_in: event.checkIn, check_out: event.checkOut,
            nights: event.nights, guests: event.guests, tel_suffix: event.tel_suffix || null,
          }).eq('id', existing.id)
        }
      } else if (!globalMap.has(event.airbnbCode)) {
        await db.from('reservations').insert({
          id: `${propertyId}-${event.airbnbCode}`, property_id: propertyId,
          airbnb_code: event.airbnbCode, guest_name: event.guestName,
          check_in: event.checkIn, check_out: event.checkOut,
          nights: event.nights, guests: event.guests, tel_suffix: event.tel_suffix || null,
        })
      } else {
        // Exists under a different property — reassign
        const other = globalMap.get(event.airbnbCode)
        if (other.property_id !== propertyId) {
          await db.from('reservations').update({
            property_id: propertyId, guest_name: event.guestName,
            check_in: event.checkIn, check_out: event.checkOut,
            nights: event.nights, guests: event.guests, tel_suffix: event.tel_suffix || null,
          }).eq('airbnb_code', event.airbnbCode)
          await db.from('checkin_records').update({ property_id: propertyId })
            .eq('reservation_id', other.id)
        }
      }
    }
  } catch (e) {
    console.error('[auto-sync] error:', e)
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { id } = await params

    // Check if ical_url is changing
    const { data: current } = await db.from('properties').select('ical_url').eq('id', id).maybeSingle()
    const icalChanged = body.ical_url && body.ical_url !== current?.ical_url

    const updates: Record<string, unknown> = {
      name:      body.name,
      ical_url:  body.ical_url,
    }
    if (body.address   !== undefined) updates.address   = body.address   || null
    if (body.mossos_id !== undefined) updates.mossos_id = body.mossos_id || null
    const coverColor = body.cover_color ?? body.coverColor
    if (coverColor) updates.cover_color = coverColor

    const { error } = await db.from('properties').update(updates).eq('id', id)
    if (error) throw error

    // Auto-sync reservations when iCal URL changes
    if (icalChanged) {
      syncPropertyReservations(id, body.ical_url) // fire-and-forget
    }

    return NextResponse.json({ success: true, message: 'Property updated' })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete reservations first (FK constraint)
    await supabase.from('reservations').delete().eq('property_id', id)

    const { error } = await supabase.from('properties').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
