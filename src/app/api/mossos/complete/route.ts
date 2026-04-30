import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabase'
import { uploadToDrive } from '@/lib/google-drive'

const db = supabaseAdmin ?? supabase

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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

    const { data: resRow } = await db.from('reservations').select('property_id, airbnb_code').eq('id', recordId).maybeSingle()

    const now = new Date().toISOString()
    const { error } = await db.from('checkin_records').upsert({
      id: crypto.randomUUID(),
      reservation_id: recordId,
      property_id: resRow?.property_id ?? null,
      airbnb_code: resRow?.airbnb_code ?? recordId.split('-').slice(1).join('-'),
      pdf_base64: pdfBase64 ?? null,
      mossos_sent: true,
      mossos_status: 'uploaded',
      sent_at: now,
      updated_at: now,
    }, { onConflict: 'reservation_id' })

    if (error) {
      console.error('[mossos/complete] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
    }

    // Upload to Google Drive if configured
    try {
      const { data: services } = await db
        .from('user_services')
        .select('drive_enabled, drive_folder_id')
        .eq('drive_enabled', true)
        .not('drive_folder_id', 'is', null)
        .maybeSingle()

      if (services?.drive_folder_id && process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        const baseName = filename?.replace(/\.pdf$/i, '') ?? recordId

        if (pdfBase64) {
          await uploadToDrive({
            folderId: services.drive_folder_id,
            filename: filename ?? `comprovant_${baseName}.pdf`,
            content: Buffer.from(pdfBase64, 'base64'),
            mimeType: 'application/pdf',
          })
          console.log('[mossos/complete] PDF subido a Drive')
        }

        const { data: record } = await db
          .from('checkin_records')
          .select('txt_content, txt_filename')
          .eq('reservation_id', recordId)
          .maybeSingle()

        if (record?.txt_content) {
          await uploadToDrive({
            folderId: services.drive_folder_id,
            filename: record.txt_filename ?? `mossos_${baseName}.txt`,
            content: record.txt_content,
            mimeType: 'text/plain',
          })
          console.log('[mossos/complete] TXT subido a Drive')
        }
      }
    } catch (driveErr) {
      console.error('[mossos/complete] Drive upload error:', driveErr)
    }

    return NextResponse.json({ ok: true }, { headers: corsHeaders })
  } catch (err) {
    console.error('[mossos/complete] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders })
  }
}
