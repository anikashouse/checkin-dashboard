import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUserId = session?.user?.id

    if (!sessionUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, address, city, ical_url, mossos_id, userId } = body

    if (!name || !ical_url) {
      return NextResponse.json(
        { error: 'Name and iCal URL are required' },
        { status: 400 }
      )
    }

    if (userId !== sessionUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('properties')
      .insert({
        user_id: userId,
        name,
        address: address || null,
        city: city || null,
        ical_url,
        mossos_id: mossos_id || null,
      })
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to create property' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
