import { supabaseAdmin, supabase } from '@/lib/supabase'
import { parseIcalText } from '@/lib/db'

const db = supabaseAdmin ?? supabase

export type SyncResult = {
  id: string
  name: string
  inserted: number
  updated: number
  removed: number
  total: number
  error?: string
}

async function fetchIcal(ical_url: string): Promise<string | null> {
  try {
    const res = await fetch(ical_url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const text = await res.text()
    return text.includes('BEGIN:VCALENDAR') ? text : null
  } catch {
    return null
  }
}

// Airbnb only publishes current and future bookings, so anything already past is
// absent from the feed by design and must never be treated as cancelled.
function todayInSpain(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}

export async function syncIcalForProperties(propertyIds: string[]): Promise<SyncResult[]> {
  if (!propertyIds.length) return []

  const { data: properties } = await db
    .from('properties')
    .select('*')
    .in('id', propertyIds)

  if (!properties?.length) return []

  const { data: allReservations } = await db.from('reservations').select('airbnb_code')
  const globalCodes = new Set(allReservations?.map((r: any) => r.airbnb_code) || [])
  const today = todayInSpain()
  const results: SyncResult[] = []

  for (const prop of properties) {
    if (!prop.ical_url) {
      results.push({ id: prop.id, name: prop.name, inserted: 0, updated: 0, removed: 0, total: 0, error: 'No iCal URL' })
      continue
    }

    const icalText = await fetchIcal(prop.ical_url)
    if (!icalText) {
      results.push({ id: prop.id, name: prop.name, inserted: 0, updated: 0, removed: 0, total: 0, error: 'Failed to fetch iCal' })
      continue
    }

    const parsedEvents = parseIcalText(icalText)
    const feedCodes = new Set(parsedEvents.map(e => e.airbnbCode))

    const { data: existingRes } = await db.from('reservations').select('*').eq('property_id', prop.id)
    const { data: records } = await db
      .from('checkin_records')
      .select('reservation_id')
      .eq('property_id', prop.id)
    const withRecord = new Set(records?.map((r: any) => r.reservation_id) || [])

    // A future booking that vanished from the feed was cancelled or rescheduled on
    // Airbnb. Dropping it is what keeps it from blocking its replacement below.
    // Anything a guest already touched is kept no matter what.
    const stale = (existingRes || []).filter((r: any) =>
      !feedCodes.has(r.airbnb_code) &&
      r.check_out >= today &&
      !r.checked_in_at &&
      !withRecord.has(r.id)
    )

    let removed = 0
    if (stale.length) {
      const { error } = await db.from('reservations').delete().in('id', stale.map((r: any) => r.id))
      if (!error) {
        removed = stale.length
        for (const r of stale) globalCodes.delete(r.airbnb_code)
      }
    }
    const staleIds = new Set(stale.map((r: any) => r.id))
    const liveRes = (existingRes || []).filter((r: any) => !staleIds.has(r.id))

    let inserted = 0, updated = 0

    for (const event of parsedEvents) {
      const existing = liveRes.find((r: any) => r.airbnb_code === event.airbnbCode)

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
        // Guard against a mangled parse inventing a booking on top of a real one.
        // Only reservations still backed by the feed (or already checked in) count,
        // so a cancelled ghost can no longer hide its replacement forever.
        const overlaps = liveRes.some((r: any) =>
          event.checkIn < r.check_out && event.checkOut > r.check_in
        )
        if (overlaps) continue

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
        if (!error) {
          inserted++
          globalCodes.add(event.airbnbCode)
          liveRes.push({ ...event, id: `${prop.id}-${event.airbnbCode}`, airbnb_code: event.airbnbCode, check_in: event.checkIn, check_out: event.checkOut })
        }
      } else {
        // Code exists but under another property (listing moved). Re-point it.
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

    results.push({ id: prop.id, name: prop.name, inserted, updated, removed, total: parsedEvents.length })
  }

  return results
}
