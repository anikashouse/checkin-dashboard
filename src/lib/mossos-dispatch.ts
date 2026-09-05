import { supabaseAdmin, supabase } from '@/lib/supabase'

const db = supabaseAdmin ?? supabase

export type DispatchResult = { ok: true } | { ok: false; error: string; status?: number }

function spainNow() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Madrid',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date())
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '00'
  return {
    date: `${get('year')}${get('month')}${get('day')}`,
    time: get('hour').replace('24', '00') + get('minute'),
  }
}

export function dashboardUrl() {
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : (process.env.NEXTAUTH_URL ?? 'https://checkin-dashboard-eight.vercel.app')
}

// Hands the stored .txt to the Playwright robot in GitHub Actions. The PAT lives only
// here — the guest check-in page is public, so it must never carry one.
export async function dispatchMossosUpload(reservationId: string): Promise<DispatchResult> {
  const { data: record } = await db
    .from('checkin_records')
    .select('txt_content, txt_filename')
    .eq('reservation_id', reservationId)
    .maybeSingle()

  if (!record?.txt_content) {
    return { ok: false, error: 'No .txt file found for this reservation', status: 400 }
  }

  const ghPat = process.env.GH_DISPATCH_PAT
  if (!ghPat) return { ok: false, error: 'GH_DISPATCH_PAT not configured', status: 500 }

  const filename = record.txt_filename || 'mossos.txt'

  // Refresh header date+time to current Spain time so it's never "posterior" to upload moment
  const { date: nowDate, time: nowTime } = spainNow()
  const txtLines = record.txt_content.split(/\r?\n/)
  if (txtLines[0]?.startsWith('1|')) {
    const parts = txtLines[0].split('|')
    if (parts.length >= 5) { parts[3] = nowDate; parts[4] = nowTime }
    txtLines[0] = parts.join('|')
  }
  const content = Buffer.from(txtLines.join('\r\n')).toString('base64')

  const repo = process.env.MOSSOS_ROBOT_REPO ?? 'anikashouse/airbnb_chekin'
  const ghRes = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
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
        dashboardUrl: dashboardUrl(),
        accessToken: process.env.MOSSOS_CALLBACK_SECRET ?? '',
      },
    }),
  })

  if (!ghRes.ok) {
    const text = await ghRes.text()
    return { ok: false, error: `GitHub dispatch failed: ${ghRes.status} ${text}`, status: 502 }
  }

  return { ok: true }
}
