'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'property' | 'services' | 'done'

export function SetupForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('property')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [propertyCreated, setPropertyCreated] = useState(false)

  const [propertyData, setPropertyData] = useState({
    name: '',
    address: '',
    city: '',
    ical_url: '',
    mossos_id: '',
  })

  const [servicesData, setServicesData] = useState({
    email_enabled: false,
    email: '',
    telegram_enabled: false,
    telegram_token: '',
    telegram_chat_id: '',
    drive_enabled: false,
    drive_folder_id: '',
  })

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...propertyData,
          userId,
        }),
      })

      if (!response.ok) {
        throw new Error('Error creating property')
      }

      setPropertyCreated(true)
      setStep('services')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating property')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveServices = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/user-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...servicesData,
        }),
      })

      if (!response.ok) {
        throw new Error('Error saving services')
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving services')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    router.push('/dashboard')
  }

  return (
    <div className="w-full">
      {/* Step 1: Create Property */}
      {step === 'property' && (
        <form onSubmit={handleCreateProperty} className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Agrega tu primera propiedad</h2>
            <p className="text-slate-600 mb-6">O salta este paso y hazlo más tarde</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Nombre de la propiedad
            </label>
            <input
              type="text"
              value={propertyData.name}
              onChange={(e) => setPropertyData({ ...propertyData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mi apartamento en Barcelona"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Dirección
            </label>
            <input
              type="text"
              value={propertyData.address}
              onChange={(e) => setPropertyData({ ...propertyData, address: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Calle Principal, 123"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Ciudad
            </label>
            <input
              type="text"
              value={propertyData.city}
              onChange={(e) => setPropertyData({ ...propertyData, city: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Barcelona"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              URL del calendario iCal
            </label>
            <input
              type="url"
              value={propertyData.ical_url}
              onChange={(e) => setPropertyData({ ...propertyData, ical_url: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://airbnb.com/calendar/..."
            />
            <p className="text-sm text-slate-500 mt-1">
              Obtén esta URL en Airbnb: Anuncio → Calendario → Exportar
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              ID de Mossos (opcional)
            </label>
            <input
              type="text"
              value={propertyData.mossos_id}
              onChange={(e) => setPropertyData({ ...propertyData, mossos_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tu ID de Mossos"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !propertyData.name || !propertyData.ical_url}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Creando...' : 'Crear propiedad'}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Saltar
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Configure Services */}
      {step === 'services' && (
        <form onSubmit={handleSaveServices} className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Configura tus servicios</h2>
            <p className="text-slate-600 mb-6">Selecciona cómo quieres recibir notificaciones</p>
          </div>

          {/* Email */}
          <div className="border border-slate-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={servicesData.email_enabled}
                onChange={(e) => setServicesData({ ...servicesData, email_enabled: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="font-medium text-slate-900">Email</span>
            </label>
            {servicesData.email_enabled && (
              <div className="mt-3 ml-8">
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={servicesData.email}
                  onChange={(e) => setServicesData({ ...servicesData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                />
              </div>
            )}
          </div>

          {/* Telegram */}
          <div className="border border-slate-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={servicesData.telegram_enabled}
                onChange={(e) => setServicesData({ ...servicesData, telegram_enabled: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="font-medium text-slate-900">Telegram</span>
            </label>
            {servicesData.telegram_enabled && (
              <div className="mt-3 ml-8 space-y-2">
                <input
                  type="text"
                  placeholder="Bot Token"
                  value={servicesData.telegram_token}
                  onChange={(e) => setServicesData({ ...servicesData, telegram_token: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="Chat ID"
                  value={servicesData.telegram_chat_id}
                  onChange={(e) => setServicesData({ ...servicesData, telegram_chat_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                />
              </div>
            )}
          </div>

          {/* Google Drive */}
          <div className="border border-slate-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={servicesData.drive_enabled}
                onChange={(e) => setServicesData({ ...servicesData, drive_enabled: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="font-medium text-slate-900">Google Drive</span>
            </label>
            {servicesData.drive_enabled && (
              <div className="mt-3 ml-8">
                <input
                  type="text"
                  placeholder="Folder ID"
                  value={servicesData.drive_folder_id}
                  onChange={(e) => setServicesData({ ...servicesData, drive_folder_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Encuentra el ID en la URL: drive.google.com/drive/folders/[ID]
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Guardando...' : 'Completar configuración'}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Más tarde
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
