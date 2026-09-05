import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'
import { syncIcalForProperties } from '@/lib/syncIcal'

const db = supabaseAdmin ?? supabase

export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: properties } = await db.from('properties').select('id')
  if (!properties?.length) return NextResponse.json({ message: 'No properties' })

  const results = await syncIcalForProperties(properties.map((p: any) => p.id))

  console.log('[cron/sync-ical]', JSON.stringify(results))
  return NextResponse.json({ ok: true, results })
}
