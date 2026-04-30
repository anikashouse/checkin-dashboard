'use client'

import { useEffect, useState } from 'react'
import type { Property } from '@/lib/types'
import Link from 'next/link'
import DeletePropertyButton from '@/components/DeletePropertyButton'

export default function PropertiesSettings() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creatingNew, setCreatingNew] = useState(false)
  const [formData, setFormData] = useState<Partial<Property>>({})
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadProperties()
  }, [])

  async function loadProperties() {
    try {
      const res = await fetch('/api/admin/properties/list')
      const data = await res.json()
      setProperties(data.properties || [])
    } catch (e) {
      console.error('Error loading properties:', e)
      setMessage('Error loading properties')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate() {
    if (!editingId || !formData.name || !formData.ical_url) {
      setMessage('Name and iCal URL are required')
      return
    }

    try {
      const res = await fetch(`/api/admin/properties/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setMessage('Property updated successfully')
        setEditingId(null)
        await loadProperties()
      } else {
        setMessage('Error updating property')
      }
    } catch (e) {
      setMessage('Error updating property')
    }
  }

  async function handleCreate() {
    if (!formData.id || !formData.name || !formData.ical_url) {
      setMessage('ID, name, and iCal URL are required')
      return
    }

    try {
      const res = await fetch('/api/admin/properties/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (res.ok) {
        setMessage('Property created successfully')
        setCreatingNew(false)
        setFormData({})
        await loadProperties()
      } else {
        setMessage(data.error || 'Error creating property')
      }
    } catch (e) {
      setMessage('Error creating property')
    }
  }

  async function testIcal(propertyId: string) {
    setTestingId(propertyId)
    setTestResult(null)

    try {
      const res = await fetch('/api/admin/properties/test-ical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId })
      })

      const data = await res.json()
      setTestResult(data)
    } catch (e) {
      setTestResult({ error: 'Error testing iCal' })
    } finally {
      setTestingId(null)
    }
  }

  async function syncProperty(propertyId: string) {
    try {
      const res = await fetch('/api/admin/properties/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId })
      })

      const data = await res.json()
      setMessage(data.message || 'Sync completed')
      await loadProperties()
    } catch (e) {
      setMessage('Error syncing property')
    }
  }

  if (loading) return (
    <div className="p-8 text-slate-500">Cargando...</div>
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Resumen
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Propiedades</h1>
        <p className="text-slate-400 text-sm mt-1">Gestiona tus propiedades e iCal URLs</p>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 text-sm">
          {message}
        </div>
      )}

      {creatingNew && (
        <div className="mb-6 border border-gray-200 rounded-xl p-6 bg-white">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5">Nueva propiedad</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ID (ej. p3)</label>
              <input type="text" value={formData.id || ''} onChange={e => setFormData({ ...formData, id: e.target.value })} placeholder="p3" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
              <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Cama doble 12 min S. Familia" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">iCal URL</label>
              <textarea value={formData.ical_url || ''} onChange={e => setFormData({ ...formData, ical_url: e.target.value })} placeholder="https://www.airbnb.es/calendar/ical/..." className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-orange-400" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mossos ID (opcional)</label>
              <input type="text" value={formData.mossos_id || ''} onChange={e => setFormData({ ...formData, mossos_id: e.target.value })} placeholder="ID50044239" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleCreate} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">Crear propiedad</button>
              <button onClick={() => { setCreatingNew(false); setFormData({}) }} className="px-4 py-2 bg-gray-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {!creatingNew && (
        <button onClick={() => setCreatingNew(true)} className="mb-6 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
          + Añadir propiedad
        </button>
      )}

      <div className="space-y-3">
        {properties.map(prop => (
          <div key={prop.id} className="border border-gray-200 rounded-xl p-6 bg-white">
            {editingId === prop.id ? (
              <div className="space-y-4">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Editar {prop.name}</h2>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                  <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">iCal URL</label>
                  <textarea value={formData.ical_url || ''} onChange={e => setFormData({ ...formData, ical_url: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-orange-400" rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mossos ID</label>
                  <input type="text" value={formData.mossos_id || ''} onChange={e => setFormData({ ...formData, mossos_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={handleUpdate} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">Guardar</button>
                  <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-gray-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancelar</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="font-bold text-slate-900">{prop.name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{prop.address || prop.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingId(prop.id); setFormData(prop) }} className="px-3 py-1 text-sm bg-gray-100 text-slate-700 rounded-lg hover:bg-gray-200">Editar</button>
                    <DeletePropertyButton propertyId={prop.id} propertyName={prop.name} onDeleted={loadProperties} />
                  </div>
                </div>
                <div className="space-y-1.5 text-sm mb-4">
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">iCal URL</span>
                    <div className="text-slate-600 font-mono text-xs mt-0.5 truncate">{prop.ical_url?.substring(0, 80)}...</div>
                  </div>
                  {prop.mossos_id && (
                    <div>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Mossos ID</span>
                      <span className="ml-2 text-slate-700 text-sm">{prop.mossos_id}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => testIcal(prop.id)} disabled={testingId === prop.id} className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100 disabled:opacity-50">
                    {testingId === prop.id ? 'Probando...' : 'Test iCal'}
                  </button>
                  <button onClick={() => syncProperty(prop.id)} className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-100">
                    Sync Now
                  </button>
                </div>
                {testResult && testResult.propertyId === prop.id && (
                  <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                    <p className="font-medium text-slate-700 mb-2">Resultado:</p>
                    <pre className="text-xs text-slate-600 overflow-auto max-h-48">{JSON.stringify(testResult, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
