import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import AppShell from '@/components/AppShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  const userName = session?.user?.name ?? 'User'
  const userEmail = session?.user?.email ?? ''

  if (!userId) redirect('/auth/signin')

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('user_id', userId)

  return (
    <AppShell
      properties={(properties as any) || []}
      userName={userName}
      userEmail={userEmail}
    >
      {children}
    </AppShell>
  )
}
