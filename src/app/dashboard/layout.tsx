import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import SidebarNav from '@/components/SidebarNav'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  const userName = session?.user?.name

  if (!userId) redirect('/auth/signin')

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('user_id', userId)

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center font-bold text-base">C</div>
            <span className="font-bold text-lg tracking-tight">CheckIn</span>
          </div>
        </div>
        <SidebarNav properties={(properties as any) || []} />
        <div className="p-4 border-t border-slate-800 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-sm font-medium">
              {userName?.[0] || 'U'}
            </div>
            <div className="text-sm flex-1 min-w-0">
              <p className="font-medium truncate">{userName || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">{session?.user?.email}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-white">
        {children}
      </div>
    </div>
  )
}
