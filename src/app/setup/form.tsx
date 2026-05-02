'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'property' | 'services' | 'done'

export function SetupForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('property')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [propertyData, setPropertyData] = useState({
    name: '',
    ical_url: '',
    mossos_id: '',
  })

  async function handleCreateProperty(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...propertyData, userId }),
      })
      if (!res.ok) throw new Error('Error al crear la propiedad')
      setStep('services')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la propiedad')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">

      {/* ── Step 1: Property ── */}
      {step === 'property' && (
        <form onSubmit={handleCreateProperty} className="space-y-5">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Tu primera propiedad</h2>
            <p className="text-sm text-slate-500 mt-1">Podrás añadir más desde Ajustes → Propiedades</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={propertyData.name}
              onChange={e => setPropertyData({ ...propertyData, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Apartamento 12 min Sagrada Família"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              iCal URL de Airbnb <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={propertyData.ical_url}
              onChange={e => setPropertyData({ ...propertyData, ical_url: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="https://www.airbnb.es/calendar/ical/..."
              required
            />
            <p className="text-xs text-slate-400 mt-1.5">
              Airbnb → Tu anuncio → Calendario → Exportar calendario
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              ID Mossos
              <span className="ml-1.5 font-normal normal-case text-slate-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={propertyData.mossos_id}
              onChange={e => setPropertyData({ ...propertyData, mossos_id: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="ID50044239"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              Número de establecimiento del Registre de Viatgers (Mossos d'Esquadra)
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !propertyData.name || !propertyData.ical_url}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Creando...' : 'Continuar'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors"
            >
              Saltar
            </button>
          </div>
        </form>
      )}

      {/* ── Step 2: Services ── */}
      {step === 'services' && (
        <div className="space-y-5">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Conecta tus servicios</h2>
            <p className="text-sm text-slate-500 mt-1">Puedes configurarlo todo más tarde en Ajustes → Servicios</p>
          </div>

          {/* Google Drive */}
          <div className="border border-slate-200 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm">Google Drive</p>
                <p className="text-xs text-slate-400 mt-0.5">Backup automático de ficheros .txt y PDF de Mossos</p>
                <a
                  href="/api/auth/drive-connect"
                  className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Conectar con Google
                </a>
              </div>
            </div>
          </div>

          {/* Telegram */}
          <div className="border border-slate-200 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.032 9.569c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.48 14.48l-2.95-.924c-.64-.203-.654-.64.136-.948l11.527-4.444c.537-.194 1.006.131.37.084z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm">Telegram</p>
                <p className="text-xs text-slate-400 mt-0.5">Notificaciones de check-in y envío de ficheros</p>
                <p className="text-xs text-slate-400 mt-2">
                  Configurable en <span className="font-medium text-slate-600">Ajustes → Servicios</span> después del setup
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors"
            >
              Ir al dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
