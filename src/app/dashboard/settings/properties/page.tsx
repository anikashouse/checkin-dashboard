'use client'

import { useEffect, useState } from 'react'
import type { Property } from '@/lib/types'
import Link from 'next/link'

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
    if (!editingId || !formData.name || !formData.icalUrl) {
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
    if (!formData.id || !formData.name || !formData.icalUrl) {
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

  if (loading) return <div className="p-6">Cargando...</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Property Settings</h1>
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>

      {message && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded text-blue-700">
          {message}
        </div>
      )}

      {creatingNew && (
        <div className="mb-6 border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-bold mb-4">Add New Property</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Property ID (e.g. p3)</label>
              <input
                type="text"
                value={formData.id || ''}
                onChange={e => setFormData({ ...formData, id: e.target.value })}
                placeholder="p3"
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Property Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Cama doble 12 min S. Familia"
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">iCal URL</label>
              <textarea
                value={formData.icalUrl || ''}
                onChange={e => setFormData({ ...formData, icalUrl: e.target.value })}
                placeholder="https://www.airbnb.es/calendar/ical/..."
                className="w-full px-3 py-2 border rounded font-mono text-sm"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mossos ID (optional)</label>
              <input
                type="text"
                value={formData.mossosId || ''}
                onChange={e => setFormData({ ...formData, mossosId: e.target.value })}
                placeholder="ID50044239"
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Create Property
              </button>
              <button
                onClick={() => {
                  setCreatingNew(false)
                  setFormData({})
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!creatingNew && (
        <button
          onClick={() => setCreatingNew(true)}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add Property
        </button>
      )}

      <div className="space-y-6">
        {properties.map(prop => (
          <div key={prop.id} className="border rounded-lg p-6 bg-white shadow-sm">
            {editingId === prop.id ? (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">Edit {prop.id}</h2>

                <div>
                  <label className="block text-sm font-medium mb-1">Property Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">iCal URL</label>
                  <textarea
                    value={formData.icalUrl || ''}
                    onChange={e => setFormData({ ...formData, icalUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded font-mono text-sm"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Mossos ID</label>
                  <input
                    type="text"
                    value={formData.mossosId || ''}
                    onChange={e => setFormData({ ...formData, mossosId: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold">{prop.id}</h2>
                    <p className="text-gray-600">{prop.name}</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingId(prop.id)
                      setFormData(prop)
                    }}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Edit
                  </button>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div>
                    <span className="font-medium">iCal URL:</span>
                    <div className="text-gray-600 break-all font-mono text-xs">
                      {prop.icalUrl?.substring(0, 100)}...
                    </div>
                  </div>
                  {prop.mossosId && (
                    <div>
                      <span className="font-medium">Mossos ID:</span>
                      <span className="ml-2 text-gray-600">{prop.mossosId}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => testIcal(prop.id)}
                    disabled={testingId === prop.id}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:bg-gray-200"
                  >
                    {testingId === prop.id ? 'Testing...' : 'Test iCal'}
                  </button>
                  <button
                    onClick={() => syncProperty(prop.id)}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Sync Now
                  </button>
                </div>

                {testResult && testResult.propertyId === prop.id && (
                  <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
                    <p className="font-medium mb-2">Test Result:</p>
                    <pre className="text-xs overflow-auto max-h-48">
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
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
