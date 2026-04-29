import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUserId = session?.user?.id

    if (!sessionUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, email_enabled, email, telegram_enabled, telegram_token, telegram_chat_id, drive_enabled, drive_folder_id } = body

    if (userId !== sessionUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    // Check if user_services already exists for this user
    const { data: existing } = await supabaseAdmin
      .from('user_services')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      // Update existing
      const { error } = await supabaseAdmin
        .from('user_services')
        .update({
          email_enabled,
          email: email || null,
          telegram_enabled,
          telegram_token: telegram_token || null,
          telegram_chat_id: telegram_chat_id || null,
          drive_enabled,
          drive_folder_id: drive_folder_id || null,
        })
        .eq('user_id', userId)

      if (error) {
        console.error('Error updating services:', error)
        return NextResponse.json({ error: 'Failed to update services' }, { status: 500 })
      }
    } else {
      // Create new
      const { error } = await supabaseAdmin
        .from('user_services')
        .insert({
          user_id: userId,
          email_enabled,
          email: email || null,
          telegram_enabled,
          telegram_token: telegram_token || null,
          telegram_chat_id: telegram_chat_id || null,
          drive_enabled,
          drive_folder_id: drive_folder_id || null,
        })

      if (error) {
        console.error('Error creating services:', error)
        return NextResponse.json({ error: 'Failed to create services' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
