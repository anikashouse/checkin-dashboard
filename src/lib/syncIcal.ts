import { supabaseAdmin, supabase } from '@/lib/supabase'
import { parseIcalText } from '@/lib/db'

const db = supabaseAdmin ?? supabase

async function fetchIcal(ical_url: string): Promise<string | null> {
  try {
    const res = await fetch(ical_url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      next: { revalidate: 0 },
    })
    if (!res.ok) return null
    const text = await res.text()
    return text.includes('BEGIN:VCALENDAR') ? text : null
  } catch {
    return null
  }
}

export async function syncIcalForProperties(propertyIds: string[]) {
  if (!propertyIds.length) return

  const { data: properties } = await db
    .from('properties')
    .select('*')
    .in('id', propertyIds)

  if (!properties?.length) return

  const { data: allReservations } = await db.from('reservations').select('airbnb_code')
  const globalCodes = new Set(allReservations?.map((r: any) => r.airbnb_code) || [])

  for (const prop of properties) {
    if (!prop.ical_url) continue

    const icalText = await fetchIcal(prop.ical_url)
    if (!icalText) continue

    const parsedEvents = parseIcalText(icalText)
    const { data: existingRes } = await db.from('reservations').select('*').eq('property_id', prop.id)

    for (const event of parsedEvents) {
      const existing = existingRes?.find((r: any) => r.airbnb_code === event.airbnbCode)

      if (existing) {
        if (existing.checked_in_at) continue
        await db.from('reservations').update({
          guest_name: event.guestName,
          check_in: event.checkIn,
          check_out: event.checkOut,
          nights: event.nights,
          guests: event.guests,
          tel_suffix: event.tel_suffix || null,
        }).eq('id', existing.id)
      } else if (!globalCodes.has(event.airbnbCode)) {
        const overlaps = existingRes?.some(
          (r: any) => event.checkIn < r.check_out && event.checkOut > r.check_in
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
        if (!error) globalCodes.add(event.airbnbCode)
      }
    }
  }
}
