import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/telegram'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

// The check-in page used to send this alert to Telegram itself, which meant shipping the
// bot token to the browser. The message is templated here and the caller only supplies
// two short fields, so a public endpoint cannot be used to post arbitrary content.
export async function POST(request: NextRequest) {
  try {
    const { airbnbCode, message } = await request.json()

    const code = String(airbnbCode ?? '—').replace(/[^A-Za-z0-9-]/g, '').slice(0, 20) || '—'
    const reason = String(message ?? '').replace(/[`*_\[\]]/g, '').slice(0, 200) || 'sin detalle'

    // Report whether it actually went out. Answering ok to a dropped notification is
    // the silent failure that let the Telegram outage run unnoticed for two months.
    const sent = await sendTelegramMessage(
      `⚠️ *Error IA — Check-in*\n📋 Reserva: \`${code}\`\n🔴 ${reason}`
    )

    return NextResponse.json({ ok: true, sent }, { headers: CORS })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400, headers: CORS })
  }
}
