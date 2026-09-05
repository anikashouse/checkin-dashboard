import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, supabase } from '@/lib/supabase'
import { syncIcalForProperties } from '@/lib/syncIcal'

const db = supabaseAdmin ?? supabase

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: properties } = await db
      .from('properties')
      .select('id')
      .eq('user_id', userId)

    if (!properties?.length) {
      return NextResponse.json({ message: 'No properties found', results: [] })
    }

    const results = await syncIcalForProperties(properties.map((p: any) => p.id))

    const totalInserted = results.reduce((s, r) => s + r.inserted, 0)
    const totalUpdated  = results.reduce((s, r) => s + r.updated, 0)
    const totalRemoved  = results.reduce((s, r) => s + r.removed, 0)

    return NextResponse.json({
      message: `Sync completo: ${totalInserted} nuevas, ${totalUpdated} actualizadas, ${totalRemoved} canceladas`,
      results,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
