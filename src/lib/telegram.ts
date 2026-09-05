// Telegram delivery lives server-side. The bot token was previously injected into the
// public check-in page, which is how it leaked and got hijacked — it must stay here.

const API = 'https://api.telegram.org'

function creds() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chat = process.env.TELEGRAM_CHAT_ID
  if (!token || !chat) return null
  return { token, chat }
}

export async function sendTelegramMessage(text: string): Promise<boolean> {
  const c = creds()
  if (!c) return false
  try {
    const res = await fetch(`${API}/bot${c.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: c.chat, text, parse_mode: 'Markdown' }),
    })
    if (!res.ok) console.error('[telegram] sendMessage failed:', res.status, await res.text())
    return res.ok
  } catch (err) {
    console.error('[telegram] sendMessage error:', err)
    return false
  }
}

export async function sendTelegramDocument(
  caption: string,
  filename: string,
  content: string | Uint8Array,
  mimeType = 'text/plain;charset=utf-8',
): Promise<boolean> {
  const c = creds()
  if (!c) {
    console.error('[telegram] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not configured')
    return false
  }
  try {
    const fd = new FormData()
    fd.set('chat_id', c.chat)
    fd.set('caption', caption)
    fd.set('parse_mode', 'Markdown')
    fd.set('document', new Blob([content as BlobPart], { type: mimeType }), filename)
    const res = await fetch(`${API}/bot${c.token}/sendDocument`, { method: 'POST', body: fd })
    if (!res.ok) console.error('[telegram] sendDocument failed:', res.status, await res.text())
    return res.ok
  } catch (err) {
    console.error('[telegram] sendDocument error:', err)
    return false
  }
}

export function buildCheckinCaption(opts: {
  airbnbCode: string
  propertyName?: string | null
  guestData?: any[] | null
  filename: string
  taxPaymentMethod?: string | null
}): string {
  const guests = opts.guestData ?? []
  const names = guests
    .map((g: any) => [g?.nom, g?.ap1, g?.ap2].filter(Boolean).join(' ').trim())
    .filter(Boolean)
    .join(', ') || '—'

  const first = guests[0] ?? {}
  const fmt = (d?: string) =>
    d && d.length === 8 ? `${d.slice(6, 8)}/${d.slice(4, 6)}/${d.slice(0, 4)}` : (d || '—')

  const cash = opts.taxPaymentMethod === 'cash'
  const taxLine = cash
    ? '\n💵 *TASA TURÍSTICA: PAGO EN EFECTIVO PENDIENTE*'
    : '\n💳 Tasa turística pagada online'

  return `🏠 *Check-in completado*\n` +
    `📋 Reserva: \`${opts.airbnbCode}\`\n` +
    `🛏 Alojamiento: ${opts.propertyName ?? '—'}\n` +
    `👤 Huésped${guests.length > 1 ? 'es' : ''}: ${names}\n` +
    `📅 ${fmt(first.entrada)} → ${fmt(first.salida)}\n` +
    `📄 Fichero: \`${opts.filename}\`` +
    taxLine + `\n` +
    `⏳ _Subiendo a Mossos…_`
}
