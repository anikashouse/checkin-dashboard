import { NextResponse } from 'next/server'
import { getProperties } from '@/lib/db'

export async function GET() {
  try {
    const properties = await getProperties()
    return NextResponse.json({ properties })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
