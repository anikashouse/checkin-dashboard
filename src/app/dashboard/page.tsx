import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import SidebarNav from '@/components/SidebarNav'
import UserMenu from '@/components/UserMenu'

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  const userName = session?.user?.name

  if (!userId) {
    redirect('/auth/signin')
  }

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('user_id', userId)

  if (!properties || properties.length === 0) {
    redirect('/setup')
  }

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center font-bold">
              C
            </div>
            <span className="font-bold">CheckIn</span>
          </div>
        </div>

        <SidebarNav properties={properties as any} />

        <div className="p-4 border-t border-slate-700 mt-auto">
          <UserMenu userName={userName} userEmail={session?.user?.email} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Buenas, {userName?.split(' ')[0]} 👋</h1>
            <p className="text-slate-400">Todo al día</p>
          </div>

          {/* Calendar placeholder */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Abril De 2026</h2>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-orange-500 text-white rounded text-sm">Mes</button>
                <button className="px-3 py-1 bg-slate-200 text-slate-900 rounded text-sm">Semana</button>
              </div>
            </div>
            <div className="aspect-video bg-slate-100 rounded flex items-center justify-center text-slate-500">
              Calendar view coming soon
            </div>
          </div>

          {/* Reservation Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4">RESUMEN DE RESERVAS</h2>
            <div className="text-slate-600">
              No reservations to display
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
