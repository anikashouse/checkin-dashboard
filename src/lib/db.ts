import { supabase, supabaseAdmin } from './supabase'
import type { Property, Reservation, CheckinStatus, GuestData } from './types'

const db = supabaseAdmin ?? supabase

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProperty(row: any): Property {
  return {
    id:         row.id,
    userId:     row.user_id,
    name:       row.name,
    address:    row.address,
    city:       row.city,
    mossos_id:   row.mossos_id,
    ical_url:    row.ical_url,
    coverColor: row.cover_color,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToReservation(row: any): Reservation {
  return {
    id:            row.id,
    propertyId:    row.property_id,
    airbnbCode:    row.airbnb_code,
    guestName:     row.guest_name,
    checkIn:       row.check_in,
    checkOut:      row.check_out,
    nights:        row.nights,
    guests:        row.guests,
    checkedInAt:   row.checked_in_at ?? undefined,
    tel_suffix:    row.tel_suffix ?? undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCheckinStatus(row: any): CheckinStatus {
  const guests = (row.guest_data ?? []) as GuestData[]
  return {
    formComplete:  row.form_complete ?? false,
    txtGenerated:  !!(row.txt_path || row.txt_content),
    mossosSent:    row.mossos_sent ?? false,
    sentAt:        row.sent_at ?? row.completed_at ?? undefined,
    guestSurname:  guests[0]?.ap1 || undefined,
    guests:        guests.length > 0 ? guests : undefined,
  }
}

async function attachCheckinStatuses(reservations: Reservation[]): Promise<Reservation[]> {
  if (!reservations.length) return reservations
  const ids = reservations.map(r => r.id)
  const { data } = await db.from('checkin_records').select('*').in('reservation_id', ids)
  if (!data || !data.length) return reservations
  const byResId = new Map(data.map((r: any) => [r.reservation_id, rowToCheckinStatus(r)]))
  return reservations.map(res => ({ ...res, checkinStatus: byResId.get(res.id) }))
}

export async function getProperties(): Promise<Property[]> {
  const { data, error } = await db.from('properties').select('*').order('name')
  if (error) { console.error('getProperties:', error); return [] }
  return data.map(rowToProperty)
}

export async function getProperty(id: string): Promise<Property | null> {
  const { data, error } = await db.from('properties').select('*').eq('id', id).single()
  if (error || !data) return null
  return rowToProperty(data)
}

export async function getReservation(id: string): Promise<Reservation | null> {
  const { data, error } = await db.from('reservations').select('*').eq('id', id).single()
  if (error || !data) return null
  const res = rowToReservation(data)
  const { data: cr } = await db.from('checkin_records').select('*').eq('reservation_id', id).maybeSingle()
  if (cr) res.checkinStatus = rowToCheckinStatus(cr)
  return res
}

export async function getReservations(propertyId: string): Promise<Reservation[]> {
  const { data, error } = await db
    .from('reservations')
    .select('*')
    .eq('property_id', propertyId)
    .order('check_in', { ascending: true })
  if (error) { console.error('getReservations:', error); return [] }
  return attachCheckinStatuses(data.map((r: any) => rowToReservation(r)))
}

export async function getReservationsByProperties(propertyIds: string[]): Promise<Reservation[]> {
  if (!propertyIds.length) return []
  const { data, error } = await db
    .from('reservations')
    .select('*')
    .in('property_id', propertyIds)
    .order('check_in', { ascending: true })
  if (error) { console.error('getReservationsByProperties:', error); return [] }
  return attachCheckinStatuses(data.map((r: any) => rowToReservation(r)))
}

export async function getAllReservations(): Promise<Reservation[]> {
  const { data, error } = await db.from('reservations').select('*')
  if (error) { console.error('getAllReservations:', error); return [] }
  return data.map((r: any) => rowToReservation(r))
}

export function parseIcalText(text: string): Array<{
  airbnbCode: string
  checkIn: string
  checkOut: string
  guestName: string
  nights: number
  guests: number
  tel_suffix?: string
}> {
  text = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '')
  const events = []
  const blocks = text.split('BEGIN:VEVENT')

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i]
    const get = (key: string) => {
      const m = block.match(new RegExp(key + '[^:]*:([^\r\n]+)'))
      return m ? m[1].trim() : ''
    }

    const dtstart = get('DTSTART')
    const dtend = get('DTEND')
    const summary = get('SUMMARY')
    const uid = get('UID')

    if (!dtstart || !dtend) continue

    const parseD = (s: string) => {
      const d = s.replace(/T.*/, '').replace(/-/g, '')
      if (d.length !== 8) return null
      return new Date(d.slice(0, 4) + '-' + d.slice(4, 6) + '-' + d.slice(6, 8))
    }

    const start = parseD(dtstart)
    const end = parseD(dtend)
    if (!start || !end) continue

    // Filter out blocked/unavailable events
    const summaryLower = summary.toLowerCase()
    if (summaryLower.includes('blocked') || summaryLower.includes('no disponible') ||
        summaryLower.includes('not available') || summaryLower.includes('unavailable') ||
        summaryLower.includes('available') || summaryLower.includes('airbnb')) continue

    const urlField = get('URL')
    const descField = get('DESCRIPTION')

    // Try to extract code from URL field or DESCRIPTION
    let detailsMatch = urlField.match(/\/details\/([A-Z0-9]+)/i)
    if (!detailsMatch) {
      detailsMatch = descField.match(/\/details\/([A-Z0-9]+)/i)
    }

    const codeMatch = detailsMatch || (uid + summary + descField).match(/HM[A-Z0-9]{6,10}/i)
    const airbnbCode = detailsMatch
      ? detailsMatch[1].toUpperCase()
      : codeMatch
        ? codeMatch[0].toUpperCase()
        : uid.split('@')[0].slice(0, 10).toUpperCase()

    const guestMatch = summary.match(/(\d+)\s*(guest|huésped|persona)/i)
    const guests = guestMatch ? parseInt(guestMatch[1]) : 1

    const desc = get('DESCRIPTION')
    const phoneMatch = desc.match(/Phone Number[^:]*:\s*(\d{4})/i)
    const tel_suffix = phoneMatch ? phoneMatch[1] : undefined

    const checkIn = start.toISOString().slice(0, 10)
    const checkOut = end.toISOString().slice(0, 10)
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    events.push({
      airbnbCode,
      checkIn,
      checkOut,
      guestName: summary.replace(/\d+\s*(?:guest|huésped)s?/i, '').trim() || 'Guest',
      nights,
      guests,
      tel_suffix,
    })
  }

  events.sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
  return events
}

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

export async function syncReservationsFromIcals(): Promise<void> {
  try {
    const properties = await getProperties()
    console.log('[iCal Sync] Found properties:', properties.length)

    // Get all existing reservations for deduplication across all properties
    const allExistingRes = await getAllReservations()

    let hasIcalUrls = false
    for (const prop of properties) {
      console.log(`[iCal Sync] Checking ${prop.name}:`, prop.ical_url ? 'has iCal' : 'NO iCal URL')
      if (!prop.ical_url) continue

      hasIcalUrls = true
      const icalText = await fetchIcal(prop.ical_url)
      if (!icalText) {
        console.warn(`Failed to fetch iCal for ${prop.name}`)
        continue
      }

      let parsedEvents = []
      try {
        parsedEvents = parseIcalText(icalText)
      } catch (err) {
        console.error(`Error parsing iCal for ${prop.name}:`, err)
        continue
      }

      const existingRes = await getReservations(prop.id)

      for (const event of parsedEvents) {
        const existing = existingRes.find(r => r.airbnbCode === event.airbnbCode)
        // Check if this code exists in ANY property (global deduplication)
        const existingGlobal = allExistingRes.find(r => r.airbnbCode === event.airbnbCode)

        if (existing) {
          if (existing.checkedInAt) continue // Skip if already checked in

          const { error } = await db
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

          if (error) console.error('Error updating reservation:', error)
        } else if (!existingGlobal) {
          // Only insert if it doesn't exist in any property
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

          if (error) console.error('Error inserting reservation:', error)
        } else {
          console.log(`[iCal Sync] Skipping duplicate reservation ${event.airbnbCode} for ${prop.name} (already exists in ${existingGlobal.propertyId})`)
        }
      }
    }

  } catch (err) {
    console.error('syncReservationsFromIcals error:', err)
  }
}
