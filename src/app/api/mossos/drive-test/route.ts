import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, supabase } from '@/lib/supabase'
import { testDriveFolder } from '@/lib/google-drive'

const db = supabaseAdmin ?? supabase

export async function GET() {
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

  try {
    const files = await testDriveFolder(services.drive_folder_id, services.google_refresh_token)
    return NextResponse.json({ ok: true, message: 'Conexión correcta. Carpeta accesible.', filesInFolder: files.length })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('invalid_grant')) {
      return NextResponse.json({
        error: 'La conexión con Google Drive ha caducado. Vuelve a conectar Google Drive.',
        reconnect: true,
      }, { status: 401 })
    }
    return NextResponse.json({ error: `Error de Drive: ${msg}` }, { status: 500 })
  }
}
