import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dispatchMossosUpload } from '@/lib/mossos-dispatch'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reservationId } = await request.json()
  if (!reservationId) return NextResponse.json({ error: 'reservationId required' }, { status: 400 })

  const result = await dispatchMossosUpload(reservationId)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 500 })
  }

  return NextResponse.json({ ok: true, message: 'Enviando a Mossos vía GitHub Actions…' })
}
