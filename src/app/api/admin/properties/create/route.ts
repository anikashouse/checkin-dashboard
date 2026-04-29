import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, name, ical_url, mossos_id, coverColor } = body

    if (!id || !name || !ical_url) {
      return NextResponse.json(
        { error: 'id, name, and ical_url are required' },
        { status: 400 }
      )
    }

    // Check if property already exists
    const { data: existing } = await supabase
      .from('properties')
      .select('id')
      .eq('id', id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Property with this ID already exists' },
        { status: 400 }
      )
    }

    // Create property
    const { error } = await supabase.from('properties').insert({
      id,
      name,
      ical_url: ical_url,
      mossos_id: mossos_id || null,
      cover_color: coverColor || '#EC4899',
      user_id: 'system' // TODO: get from session
    })

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Property created successfully',
      propertyId: id
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
