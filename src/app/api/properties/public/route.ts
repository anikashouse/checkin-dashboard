import { NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'

const db = supabaseAdmin ?? supabase

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET() {
  // Try with photo_url first; fall back to id+name only if column doesn't exist yet
  let { data, error } = await db
    .from('properties')
    .select('id, name, photo_url')
    .order('id', { ascending: true })

  if (error?.message?.includes('photo_url')) {
    const fallback = await db.from('properties').select('id, name').order('id', { ascending: true })
    data = fallback.data as typeof data
    error = fallback.error
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS })
  return NextResponse.json(data ?? [], { headers: CORS })
}
