import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, supabase } from '@/lib/supabase'
import { syncIcalForProperties } from '@/lib/syncIcal'

const db = supabaseAdmin ?? supabase

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: properties } = await db
    .from('properties')
    .select('id')
    .eq('user_id', session.user.id)

  if (!properties?.length) return NextResponse.json({ message: 'No properties', results: [] })

  const results = await syncIcalForProperties(properties.map((p: any) => p.id))

  return NextResponse.json({ ok: true, results })
}
