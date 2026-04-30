import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, supabase } from '@/lib/supabase'
import { testDriveFolder } from '@/lib/google-drive'

const db = supabaseAdmin ?? supabase

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return NextResponse.json({ error: 'Service Account no configurada en Vercel (GOOGLE_SERVICE_ACCOUNT_JSON)' }, { status: 400 })
  }

  const { data: services } = await db
    .from('user_services')
    .select('drive_folder_id')
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (!services?.drive_folder_id) {
    return NextResponse.json({ error: 'No hay carpeta configurada' }, { status: 400 })
  }

  try {
    const files = await testDriveFolder(services.drive_folder_id)
    return NextResponse.json({
      ok: true,
      message: `Conexión correcta. Carpeta accesible.`,
      filesInFolder: files.length,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Error de Drive: ${msg}` }, { status: 500 })
  }
}
