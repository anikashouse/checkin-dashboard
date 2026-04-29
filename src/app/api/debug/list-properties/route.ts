import { NextResponse } from 'next/server'
import { getProperties } from '@/lib/db'

export async function GET() {
  try {
    const properties = await getProperties()
    return NextResponse.json({
      properties: properties.map(p => ({
        id: p.id,
        name: p.name,
        ical_url: p.ical_url,
      }))
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
