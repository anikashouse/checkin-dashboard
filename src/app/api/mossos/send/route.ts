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

  // Refresh header date+time to current Spain time so it's never "posterior" to upload moment
  const spainParts = new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Madrid',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date())
  const get = (t: string) => spainParts.find(p => p.type === t)?.value ?? '00'
  const nowDate = `${get('year')}${get('month')}${get('day')}`
  const nowTime = get('hour').replace('24', '00') + get('minute')

  const txtLines = record.txt_content.split(/\r?\n/)
  if (txtLines[0]?.startsWith('1|')) {
    const parts = txtLines[0].split('|')
    if (parts.length >= 5) { parts[3] = nowDate; parts[4] = nowTime }
    txtLines[0] = parts.join('|')
  }
  const content = Buffer.from(txtLines.join('\r\n')).toString('base64')
  const dashboardUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://checkin-dashboard-eight.vercel.app'
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
