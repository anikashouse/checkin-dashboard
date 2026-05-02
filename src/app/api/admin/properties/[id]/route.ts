import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

const db = supabaseAdmin ?? supabase

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { id } = await params

    const updates: Record<string, unknown> = {
      name:      body.name,
      ical_url:  body.ical_url,
    }
    if (body.address   !== undefined) updates.address   = body.address   || null
    if (body.mossos_id !== undefined) updates.mossos_id = body.mossos_id || null
    const coverColor = body.cover_color ?? body.coverColor
    if (coverColor) updates.cover_color = coverColor

    const { error } = await db
      .from('properties')
      .update(updates)
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Property updated' })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete reservations first (FK constraint)
    await supabase.from('reservations').delete().eq('property_id', id)

    const { error } = await supabase.from('properties').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
