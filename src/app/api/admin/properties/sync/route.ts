import { NextResponse } from 'next/server'
import { syncIcalForProperties } from '@/lib/syncIcal'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { propertyId } = body
    if (!propertyId) throw new Error('propertyId required')

    console.log(`[Sync] Starting sync for ${propertyId}`)

    const [result] = await syncIcalForProperties([propertyId])
    if (!result) throw new Error('Property not found')
    if (result.error) {
      return NextResponse.json({ success: false, error: result.error })
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${result.name}: ${result.inserted} inserted, ${result.updated} updated, ${result.removed} cancelled`,
      stats: {
        propertyId,
        propertyName: result.name,
        eventsFound: result.total,
        inserted: result.inserted,
        updated: result.updated,
        removed: result.removed,
        skipped: result.total - result.inserted - result.updated,
      }
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
