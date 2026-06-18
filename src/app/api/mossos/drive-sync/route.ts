import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, supabase } from '@/lib/supabase'
import { uploadToDrive, getOrCreateFolder } from '@/lib/google-drive'

const db = supabaseAdmin ?? supabase

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: services } = await db
    .from('user_services')
    .select('drive_folder_id, google_refresh_token')
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (!services?.drive_folder_id)
    return NextResponse.json({ error: 'No hay carpeta configurada' }, { status: 400 })
  if (!services?.google_refresh_token)
    return NextResponse.json({ error: 'Google Drive no conectado. Usa el botón "Conectar Google Drive".' }, { status: 400 })

  const { data: records, error } = await db
    .from('checkin_records')
    .select('reservation_id, airbnb_code, txt_content, txt_filename, pdf_base64')
    .eq('mossos_sent', true)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!records?.length) return NextResponse.json({ ok: true, uploaded: 0, message: 'No hay registros para sincronizar' })

  let uploaded = 0
  const errors: string[] = []

  for (const rec of records) {
    const base = rec.airbnb_code ?? rec.reservation_id

    let subFolderId: string
    try {
      subFolderId = await getOrCreateFolder(services.drive_folder_id, base, services.google_refresh_token)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('invalid_grant')) {
        return NextResponse.json({
          error: 'La conexión con Google Drive ha caducado. Ve a Ajustes → Servicios y vuelve a conectar Google Drive.',
          reconnect: true,
        }, { status: 401 })
      }
      errors.push(`Folder ${base}: ${msg}`)
      continue
    }

    if (rec.txt_content) {
      try {
        await uploadToDrive({
          folderId: subFolderId,
          filename: rec.txt_filename ?? `mossos_${base}.txt`,
          content: rec.txt_content,
          mimeType: 'text/plain',
          refreshToken: services.google_refresh_token,
        })
        uploaded++
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes('invalid_grant')) {
          return NextResponse.json({
            error: 'La conexión con Google Drive ha caducado. Ve a Ajustes → Servicios y vuelve a conectar Google Drive.',
            reconnect: true,
          }, { status: 401 })
        }
        errors.push(`TXT ${base}: ${msg}`)
      }
    }

    if (rec.pdf_base64) {
      try {
        await uploadToDrive({
          folderId: subFolderId,
          filename: `comprovant_${base}.pdf`,
          content: Buffer.from(rec.pdf_base64, 'base64'),
          mimeType: 'application/pdf',
          refreshToken: services.google_refresh_token,
        })
        uploaded++
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes('invalid_grant')) {
          return NextResponse.json({
            error: 'La conexión con Google Drive ha caducado. Ve a Ajustes → Servicios y vuelve a conectar Google Drive.',
            reconnect: true,
          }, { status: 401 })
        }
        errors.push(`PDF ${base}: ${msg}`)
      }
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    uploaded,
    errors: errors.length ? errors : undefined,
    message: `${uploaded} fichero(s) subidos a Drive${errors.length ? ` (${errors.length} errores)` : ''}`,
  })
}
