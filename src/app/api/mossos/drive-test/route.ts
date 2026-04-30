import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, supabase } from '@/lib/supabase'
import { google } from 'googleapis'

const db = supabaseAdmin ?? supabase

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: services } = await db
    .from('user_services')
    .select('drive_enabled, drive_folder_id, google_refresh_token')
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (!services?.drive_folder_id) return NextResponse.json({ error: 'No hay carpeta configurada' }, { status: 400 })
  if (!services?.google_refresh_token) return NextResponse.json({ error: 'No hay token de Google. Cierra sesión y vuelve a entrar.' }, { status: 400 })

  try {
    const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)
    auth.setCredentials({ refresh_token: services.google_refresh_token })
    const drive = google.drive({ version: 'v3', auth })

    const res = await drive.files.list({
      q: `'${services.drive_folder_id}' in parents and trashed = false`,
      pageSize: 1,
      fields: 'files(id,name)',
    })

    return NextResponse.json({
      ok: true,
      message: `Conexión correcta. La carpeta existe y es accesible.`,
      filesInFolder: res.data.files?.length ?? 0,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Error de Drive: ${msg}` }, { status: 500 })
  }
}
