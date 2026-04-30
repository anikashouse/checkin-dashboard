import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, supabase } from '@/lib/supabase'

const db = supabaseAdmin ?? supabase

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reservationId } = await request.json()
  if (!reservationId) return NextResponse.json({ error: 'reservationId required' }, { status: 400 })

  const { data: record } = await db
    .from('checkin_records')
    .select('txt_content, txt_filename')
    .eq('reservation_id', reservationId)
    .maybeSingle()

  if (!record?.txt_content) {
    return NextResponse.json({ error: 'No .txt file found for this reservation' }, { status: 400 })
  }

  const mossosUrl = process.env.MOSSOS_API_URL
  const mossosUser = process.env.MOSSOS_USER
  const mossosPass = process.env.MOSSOS_PASS

  if (!mossosUrl) {
    return NextResponse.json({ error: 'MOSSOS_API_URL not configured' }, { status: 500 })
  }

  const filename = record.txt_filename || 'mossos.txt'
  const blob = new Blob([record.txt_content], { type: 'text/plain' })
  const fd = new FormData()
  fd.append('file', blob, filename)
  if (mossosUser) fd.append('user', mossosUser)
  if (mossosPass) fd.append('password', mossosPass)

  const mossosRes = await fetch(mossosUrl, { method: 'POST', body: fd })

  if (!mossosRes.ok) {
    const text = await mossosRes.text()
    return NextResponse.json({ error: `Mossos API error: ${mossosRes.status} ${text}` }, { status: 502 })
  }

  const pdfBuffer = await mossosRes.arrayBuffer()
  const pdfBase64 = Buffer.from(pdfBuffer).toString('base64')

  const { error } = await db.from('checkin_records').update({
    pdf_base64: pdfBase64,
    mossos_sent: true,
    sent_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('reservation_id', reservationId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, pdfBase64 })
}
