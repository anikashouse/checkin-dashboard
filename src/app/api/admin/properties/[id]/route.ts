import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { id } = await params

    const { error } = await supabase
      .from('properties')
      .update({
        name:        body.name,
        address:     body.address,
        ical_url:    body.ical_url,
        mossos_id:   body.mossos_id,
        cover_color: body.cover_color ?? null,
      })
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
