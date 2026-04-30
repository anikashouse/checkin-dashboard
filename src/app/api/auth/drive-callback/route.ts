import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const userId = request.nextUrl.searchParams.get('state')
  const error = request.nextUrl.searchParams.get('error')

  const baseUrl = process.env.APP_URL
    ?? process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    ?? 'https://checkin-dashboard-eight.vercel.app'

  if (error || !code || !userId) {
    return NextResponse.redirect(`${baseUrl}/dashboard/settings/services?drive=error`)
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${baseUrl}/api/auth/drive-callback`,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json()

  if (!tokens.refresh_token || !supabaseAdmin) {
    console.error('[drive-callback] no refresh_token or no supabase:', tokens)
    return NextResponse.redirect(`${baseUrl}/dashboard/settings/services?drive=error`)
  }

  await supabaseAdmin.from('user_services').upsert({
    user_id: userId,
    google_refresh_token: tokens.refresh_token,
  }, { onConflict: 'user_id' })

  return NextResponse.redirect(`${baseUrl}/dashboard/settings/services?drive=connected`)
}
