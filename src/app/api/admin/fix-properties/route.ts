import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { syncReservationsFromIcals } from '@/lib/db'

export async function POST() {
  try {
    console.log('[Fix Properties] Starting...')

    // Step 1: Delete ALL reservations
    console.log('[Fix Properties] Deleting ALL reservations...')
    const { error: deleteError } = await supabase
      .from('reservations')
      .delete()
      .neq('id', '')

    if (deleteError) throw deleteError

    // Step 2: Get current properties
    console.log('[Fix Properties] Fetching current properties...')
    const { data: properties, error: fetchError } = await supabase
      .from('properties')
      .select('id, name, ical_url')

    if (fetchError) throw fetchError

    console.log('[Fix Properties] Current state:')
    properties?.forEach(p => console.log(`  ${p.id}: ${p.name} -> ${p.ical_url?.substring(0, 60)}...`))

    // Step 3: Swap properties (interchange p1 and p2)
    console.log('[Fix Properties] Swapping p1 and p2...')

    const p1 = properties?.find(p => p.id === 'p1')
    const p2 = properties?.find(p => p.id === 'p2')

    if (!p1 || !p2) {
      throw new Error('Properties p1 or p2 not found')
    }

    // Update p1: should be "Cama doble" with 50886202
    // Update p2: should be "12 minutes" with 50050101
    const { error: update1Error } = await supabase
      .from('properties')
      .update({
        name: 'Cama doble 12 min S. Familia',
        ical_url: p1.ical_url  // Keep p1's URL (should be 202)
      })
      .eq('id', 'p1')

    const { error: update2Error } = await supabase
      .from('properties')
      .update({
        name: '12 minutes from Sagrada Familia by metro',
        ical_url: p2.ical_url  // Keep p2's URL (should be 101)
      })
      .eq('id', 'p2')

    if (update1Error) throw update1Error
    if (update2Error) throw update2Error

    console.log('[Fix Properties] Properties updated')

    // Step 4: Re-sync iCals
    console.log('[Fix Properties] Syncing iCals with deduplication...')
    await syncReservationsFromIcals()

    // Step 5: Get final counts
    const { data: allRes } = await supabase
      .from('reservations')
      .select('property_id')

    const counts: Record<string, number> = {}
    allRes?.forEach((r: any) => {
      counts[r.property_id] = (counts[r.property_id] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      message: 'Properties fixed and re-synced',
      steps: [
        '[OK] Deleted all reservations',
        '[OK] Fixed property names',
        '[OK] Re-synced iCals with deduplication'
      ],
      reservationCounts: counts
    })
  } catch (err) {
    console.error('[Fix Properties] Error:', err)
    const errorMessage = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: err instanceof Error ? err.message : err
      },
      { status: 500 }
    )
  }
}
