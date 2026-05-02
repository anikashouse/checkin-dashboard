import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'
import { uploadToDrive, getOrCreateFolder } from '@/lib/google-drive'

const db = supabaseAdmin ?? supabase

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

async function sendTelegramDocument(buffer: Buffer, filename: string, caption: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return
  const fd = new FormData()
  fd.append('chat_id', chatId)
  fd.append('caption', caption)
  fd.append('document', new Blob([new Uint8Array(buffer)]), filename)
  await fetch(`https://api.telegram.org/bot${token}/sendDocument`, { method: 'POST', body: fd })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const { recordId, pdfBase64, filename, accessToken } = await request.json()

    const expectedSecret = process.env.MOSSOS_CALLBACK_SECRET
    if (expectedSecret && accessToken && accessToken !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    }

    if (!recordId) {
      return NextResponse.json({ error: 'recordId required' }, { status: 400, headers: corsHeaders })
    }

    // recordId may be a UUID (from old flow) or an Airbnb code (from index.html dispatch)
    let resRow: { property_id: string; airbnb_code: string } | null = null
    let resolvedId = recordId
    const { data: byId } = await db.from('reservations').select('id, property_id, airbnb_code').eq('id', recordId).maybeSingle()
    if (byId) {
      resRow = byId
      resolvedId = byId.id
    } else {
      const { data: byCode } = await db.from('reservations').select('id, property_id, airbnb_code').ilike('airbnb_code', recordId).maybeSingle()
      if (byCode) { resRow = byCode; resolvedId = byCode.id }
    }

    const now = new Date().toISOString()
    const { error } = await db
      .from('checkin_records')
      .update({
        pdf_base64: pdfBase64 ?? null,
        mossos_sent: true,
        sent_at: now,
        updated_at: now,
      })
      .eq('reservation_id', resolvedId)

    if (error) {
      console.error('[mossos/complete] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
    }

    // Upload to Google Drive if configured
    try {
      const { data: services } = await db
        .from('user_services')
        .select('drive_enabled, drive_folder_id, google_refresh_token')
        .eq('drive_enabled', true)
        .not('drive_folder_id', 'is', null)
        .not('google_refresh_token', 'is', null)
        .maybeSingle()

      if (services?.drive_folder_id && services?.google_refresh_token) {
        const airbnbCode = resRow?.airbnb_code ?? recordId
        const subFolderId = await getOrCreateFolder(
          services.drive_folder_id,
          airbnbCode,
          services.google_refresh_token,
        )

        const { data: record } = await db
          .from('checkin_records')
          .select('txt_content, txt_filename')
          .eq('reservation_id', resolvedId)
          .maybeSingle()

        if (record?.txt_content) {
          await uploadToDrive({
            folderId: subFolderId,
            filename: record.txt_filename ?? `mossos_${airbnbCode}.txt`,
            content: record.txt_content,
            mimeType: 'text/plain',
            refreshToken: services.google_refresh_token,
          })
          console.log('[mossos/complete] TXT subido a Drive')
        }

        if (pdfBase64) {
          await uploadToDrive({
            folderId: subFolderId,
            filename: filename ?? `comprovant_${airbnbCode}.pdf`,
            content: Buffer.from(pdfBase64, 'base64'),
            mimeType: 'application/pdf',
            refreshToken: services.google_refresh_token,
          })
          console.log('[mossos/complete] PDF subido a Drive')
        }
      }
    } catch (driveErr) {
      console.error('[mossos/complete] Drive upload error:', driveErr)
    }

    // Telegram: send TXT + PDF once Mossos confirms
    try {
      const { data: record } = await db
        .from('checkin_records')
        .select('txt_content, txt_filename')
        .eq('reservation_id', recordId)
        .maybeSingle()

      const caption = `✅ Mossos confirmat\n📋 Reserva: \`${resRow?.airbnb_code ?? recordId}\``

      if (record?.txt_content) {
        const txtName = record.txt_filename ?? `mossos_${recordId}.txt`
        await sendTelegramDocument(Buffer.from(record.txt_content, 'utf-8'), txtName, caption)
        console.log('[mossos/complete] TXT enviado a Telegram')
      }

      if (pdfBase64) {
        const pdfName = filename ?? `comprobante_${recordId}.pdf`
        await sendTelegramDocument(Buffer.from(pdfBase64, 'base64'), pdfName, caption)
        console.log('[mossos/complete] PDF enviado a Telegram')
      }
    } catch (tgErr) {
      console.error('[mossos/complete] Telegram error:', tgErr)
    }

    return NextResponse.json({ ok: true }, { headers: corsHeaders })
  } catch (err) {
    console.error('[mossos/complete] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders })
  }
}
