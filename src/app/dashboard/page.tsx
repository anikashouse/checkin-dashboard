import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('userId', session.user.id)

  if (!properties || properties.length === 0) {
    redirect('/setup')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <div className="text-sm text-slate-600">
            {session.user.email}
          </div>
        </div>

        {!properties || properties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">No properties yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property: any) => (
              <div
                key={property.id}
                className="bg-white rounded-lg shadow p-6"
              >
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  {property.name}
                </h2>
                {property.address && (
                  <p className="text-slate-600 mb-4">{property.address}</p>
                )}
                <p className="text-sm text-slate-500">
                  ID: {property.id}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
