import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import Calendar from '@/components/Calendar'

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) redirect('/auth/signin')

  const { data: properties } = await supabase.from('properties').select('*').eq('user_id', userId)
  if (!properties || properties.length === 0) redirect('/setup')

  const property = properties.find(p => p.id === id)
  if (!property) redirect('/dashboard')

  const { data: reservations = [] } = await supabase.from('reservations').select('*').eq('property_id', id)

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">{property.name}</h1>
      {property.address && <p className="text-slate-500 mb-8">{property.address}</p>}
      <div className="mb-8">
        <Calendar reservations={reservations as any} year={currentYear} month={currentMonth} />
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">RESERVAS</h2>
        {reservations?.length > 0 ? (
          <div className="space-y-3">
            {reservations.map(res => (
              <div key={res.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{res.guestName || 'Guest'}</p>
                    <p className="text-sm text-slate-600">{res.airbnbCode || 'N/A'}</p>
                  </div>
                  <div className="text-right text-sm text-slate-600">
                    {new Date(res.checkIn).toLocaleDateString('es-ES')} — {new Date(res.checkOut).toLocaleDateString('es-ES')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-slate-500">Sin reservas</p>}
      </div>
    </div>
  )
}
