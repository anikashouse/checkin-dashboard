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

  const ghPat = process.env.GH_DISPATCH_PAT
  if (!ghPat) return NextResponse.json({ error: 'GH_DISPATCH_PAT not configured' }, { status: 500 })

  const filename = record.txt_filename || 'mossos.txt'
  const content  = Buffer.from(record.txt_content).toString('base64')
  const dashboardUrl = process.env.NEXTAUTH_URL?.replace('http://localhost:3000', 'https://checkin-dashboard-eight.vercel.app')
    ?? 'https://checkin-dashboard-eight.vercel.app'
  const callbackSecret = process.env.MOSSOS_CALLBACK_SECRET ?? ''

  const ghRes = await fetch('https://api.github.com/repos/anikashouse/airbnb_chekin/dispatches', {
    method: 'POST',
    headers: {
      'Authorization': `token ${ghPat}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event_type: 'mossos-upload',
      client_payload: {
        filename,
        content,
        recordId: reservationId,
        dashboardUrl,
        accessToken: callbackSecret,
      },
    }),
  })

  if (!ghRes.ok) {
    const text = await ghRes.text()
    return NextResponse.json({ error: `GitHub dispatch failed: ${ghRes.status} ${text}` }, { status: 502 })
  }

  return NextResponse.json({ ok: true, message: 'Enviando a Mossos vía GitHub Actions…' })
}
