import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { syncReservationsFromIcals } from '@/lib/db'

export async function POST() {
  try {
    console.log('[Fix Duplicates] Starting...')

    // Step 1: Delete all duplicates from p2
    console.log('[Fix Duplicates] Deleting reservations from p2...')
    const { error: deleteError } = await supabase
      .from('reservations')
      .delete()
      .eq('property_id', 'p2')

    if (deleteError) throw deleteError
    console.log('[Fix Duplicates] ✓ Deleted duplicates from p2')

    // Step 2: Sync iCals (only p1 will insert, p2 will be empty)
    console.log('[Fix Duplicates] Syncing iCals...')
    await syncReservationsFromIcals()
    console.log('[Fix Duplicates] ✓ Sync completed')

    return NextResponse.json({
      success: true,
      message: 'Duplicates fixed! Cleaned p2 and re-synced iCals',
      steps: [
        '✓ Deleted all duplicates from p2',
        '✓ Re-synced iCals with deduplication',
        '✓ Dashboard should now show only p1 reservations'
      ]
    })
  } catch (err) {
    console.error('[Fix Duplicates] Error:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
