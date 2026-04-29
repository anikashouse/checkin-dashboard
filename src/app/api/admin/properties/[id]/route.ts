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
        name: body.name,
        ical_url: body.ical_url,
        mossos_id: body.mossos_id,
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
