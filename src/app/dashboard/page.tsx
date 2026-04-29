import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import SidebarNav from '@/components/SidebarNav'
import Link from 'next/link'

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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center font-bold text-sm">
              C
            </div>
            <span className="font-bold text-base">Checkin</span>
          </div>
        </div>

        <SidebarNav properties={properties as any} />

        <div className="p-4 border-t border-slate-700 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-sm font-medium">
              {userName?.[0] || 'U'}
            </div>
            <div className="text-sm">
              <p className="font-medium">{userName || 'User'}</p>
              <p className="text-xs text-slate-400">{session?.user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Buenas, {userName?.split(' ')[0]} 👋</h1>
            <p className="text-slate-500">Todo al día</p>
          </div>

          {/* Calendar placeholder */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">Abril De 2026</h2>
              <div className="flex gap-2">
                <button className="px-4 py-1.5 bg-orange-500 text-white rounded text-sm font-medium hover:bg-orange-600">Mes</button>
                <button className="px-4 py-1.5 bg-gray-100 text-slate-900 rounded text-sm font-medium hover:bg-gray-200">Semana</button>
              </div>
            </div>
            <div className="aspect-video bg-gray-50 rounded flex items-center justify-center text-gray-400">
              Calendar view coming soon
            </div>
          </div>

          {/* Reservation Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">RESUMEN DE RESERVAS</h2>
            <div className="text-slate-500">
              No reservations to display
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
