'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Services {
  email_enabled: boolean
  email: string
  telegram_enabled: boolean
  telegram_token: string
  telegram_chat_id: string
  drive_enabled: boolean
  drive_folder_id: string
}

const empty: Services = {
  email_enabled: false,
  email: '',
  telegram_enabled: false,
  telegram_token: '',
  telegram_chat_id: '',
  drive_enabled: false,
  drive_folder_id: '',
}

export default function ServicesPage() {
  const [form, setForm] = useState<Services>(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/user-services')
      .then(r => r.json())
      .then(d => {
        if (d.services) setForm({ ...empty, ...d.services })
      })
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/user-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setMessage(res.ok ? 'Guardado correctamente' : 'Error al guardar')
    } catch {
      setMessage('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-slate-500">Cargando...</div>

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Resumen
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Servicios</h1>
        <p className="text-slate-400 text-sm mt-1">Configura las integraciones para notificaciones y backups</p>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 text-sm">
          {message}
        </div>
      )}

      <div className="space-y-4">

        {/* Telegram */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.032 9.569c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.48 14.48l-2.95-.924c-.64-.203-.654-.64.136-.948l11.527-4.444c.537-.194 1.006.131.37.084z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Telegram</h2>
                <p className="text-xs text-slate-400">Notificaciones de check-in y envío de ficheros</p>
              </div>
            </div>
            <button
              onClick={() => setForm(f => ({ ...f, telegram_enabled: !f.telegram_enabled }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.telegram_enabled ? 'bg-orange-500' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.telegram_enabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          {form.telegram_enabled && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Bot Token</label>
                <input
                  type="text"
                  value={form.telegram_token}
                  onChange={e => setForm(f => ({ ...f, telegram_token: e.target.value }))}
                  placeholder="1234567890:AAGb7Peu..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Chat ID</label>
                <input
                  type="text"
                  value={form.telegram_chat_id}
                  onChange={e => setForm(f => ({ ...f, telegram_chat_id: e.target.value }))}
                  placeholder="-5102120877"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Email</h2>
                <p className="text-xs text-slate-400">Envío de enlace de check-in al huésped</p>
              </div>
            </div>
            <button
              onClick={() => setForm(f => ({ ...f, email_enabled: !f.email_enabled }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.email_enabled ? 'bg-orange-500' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.email_enabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          {form.email_enabled && (
            <div className="pt-2 border-t border-gray-100">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Dirección de email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="tuemail@gmail.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          )}
        </div>

        {/* Google Drive */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Google Drive</h2>
                <p className="text-xs text-slate-400">Backup automático de ficheros .txt y PDF</p>
              </div>
            </div>
            <button
              onClick={() => setForm(f => ({ ...f, drive_enabled: !f.drive_enabled }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.drive_enabled ? 'bg-orange-500' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.drive_enabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          {form.drive_enabled && (
            <div className="pt-2 border-t border-gray-100">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Folder ID</label>
              <input
                type="text"
                value={form.drive_folder_id}
                onChange={e => setForm(f => ({ ...f, drive_folder_id: e.target.value }))}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          )}
        </div>

      </div>

      <div className="mt-6">
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
