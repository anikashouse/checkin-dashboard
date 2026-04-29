import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Get table info from information_schema
    const { data, error } = await supabase.rpc('get_table_constraints', {
      table_name: 'checkin_records'
    }).catch(() => null)

    // Alternative: just try to get a sample record to see structure
    const { data: sample } = await supabase
      .from('checkin_records')
      .select('*')
      .limit(1)

    return NextResponse.json({
      sample_record: sample?.[0],
      message: 'Check the sample record structure above'
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}
