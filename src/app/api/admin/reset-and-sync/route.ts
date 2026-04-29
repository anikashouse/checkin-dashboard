import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { syncReservationsFromIcals } from '@/lib/db'

export async function POST() {
  try {
    console.log('[Reset and Sync] Starting...')

    // Step 1: Delete ALL reservations
    console.log('[Reset and Sync] Deleting ALL reservations...')
    const { error: deleteError } = await supabase
      .from('reservations')
      .delete()
      .neq('id', '') // Delete everything

    if (deleteError) throw deleteError
    console.log('[Reset and Sync] ✓ Deleted all reservations')

    // Step 2: Verify property configuration
    console.log('[Reset and Sync] Verifying property configuration...')
    const { data: properties, error: propsError } = await supabase
      .from('properties')
      .select('id, name, ical_url')

    if (propsError) throw propsError

    console.log('[Reset and Sync] Current properties:')
    properties?.forEach((p: any) => {
      console.log(`  - ${p.id}: ${p.name} → ${p.ical_url?.substring(0, 50)}...`)
    })

    // Step 3: Sync iCals with deduplication
    console.log('[Reset and Sync] Syncing iCals with deduplication...')
    await syncReservationsFromIcals()
    console.log('[Reset and Sync] ✓ Sync completed')

    // Step 4: Get final count
    const { data: allRes, error: countError } = await supabase
      .from('reservations')
      .select('property_id, count', { count: 'exact' })

    if (countError) throw countError

    const counts: Record<string, number> = {}
    allRes?.forEach((r: any) => {
      counts[r.property_id] = (counts[r.property_id] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      message: 'Reset complete! All reservations deleted and re-synced from iCals',
      steps: [
        '✓ Deleted ALL reservations from database',
        '✓ Re-synced iCals with deduplication',
      ],
      properties: properties?.map((p: any) => ({
        id: p.id,
        name: p.name,
        hasIcal: !!p.ical_url,
        ical: p.ical_url?.substring(0, 70) + '...'
      })),
      reservationCounts: counts
    })
  } catch (err) {
    console.error('[Reset and Sync] Error:', err)
    const errorMessage = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[Reset and Sync] Full error:', errorMessage)
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: err instanceof Error ? {
          name: err.name,
          message: err.message,
          stack: err.stack
        } : err
      },
      { status: 500 }
    )
  }
}
