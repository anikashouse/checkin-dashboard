import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, supabase } from '@/lib/supabase'

const db = supabaseAdmin ?? supabase

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const reservationId = formData.get('reservationId') as string
  const file = formData.get('file') as File

  if (!reservationId || !file) {
    return NextResponse.json({ error: 'reservationId and file required' }, { status: 400 })
  }

  const txtContent = await file.text()

  const { error } = await db.from('checkin_records').upsert({
    reservation_id: reservationId,
    airbnb_code: reservationId.split('-').slice(1).join('-'),
    txt_content: txtContent,
    txt_filename: file.name,
    form_complete: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'reservation_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
