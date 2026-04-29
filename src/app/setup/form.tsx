'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SetupForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    ical_url: '',
    mossos_id: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId,
        }),
      })

      if (!response.ok) {
        throw new Error('Error creating property')
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating property')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">
          Nombre de la propiedad *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Barcelona"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">
          URL del calendario iCal *
        </label>
        <input
          type="url"
          required
          value={formData.ical_url}
          onChange={(e) => setFormData({ ...formData, ical_url: e.target.value })}
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
          value={formData.mossos_id}
          onChange={(e) => setFormData({ ...formData, mossos_id: e.target.value })}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Tu ID de Mossos"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
      >
        {loading ? 'Creando...' : 'Crear propiedad'}
      </button>
    </form>
  )
}
