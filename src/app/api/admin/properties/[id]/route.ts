import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { id } = params

    const { error } = await supabase
      .from('properties')
      .update({
        name: body.name,
        ical_url: body.icalUrl,
        mossos_id: body.mossosId,
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
