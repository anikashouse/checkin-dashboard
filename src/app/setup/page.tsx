import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { SetupForm } from './form'

export default async function SetupPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Bienvenido</h1>
            <p className="text-slate-600 mt-2">Configura tu primera propiedad para empezar</p>
          </div>

          <SetupForm userId={session.user.id} />
        </div>
      </div>
    </div>
  )
}
