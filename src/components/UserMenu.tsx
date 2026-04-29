'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'

export default function UserMenu({ userName, userEmail }: { userName?: string; userEmail?: string }) {
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/signin' })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 hover:bg-slate-700 rounded-lg p-2 transition-colors"
      >
        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
          {userName?.[0] || 'U'}
        </div>
        <div className="text-sm text-left min-w-0">
          <p className="font-medium truncate">{userName || 'User'}</p>
          <p className="text-xs text-slate-400 truncate">{userEmail}</p>
        </div>
        <svg className="w-4 h-4 ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-700 rounded-lg shadow-lg overflow-hidden z-50">
          <Link
            href="/dashboard/settings/properties"
            className="block w-full px-4 py-2 text-sm text-left hover:bg-slate-600 transition-colors"
            onClick={() => setOpen(false)}
          >
            ⚙️ Propiedades
          </Link>
          <button
            onClick={handleLogout}
            className="block w-full px-4 py-2 text-sm text-left text-red-400 hover:bg-slate-600 transition-colors border-t border-slate-600"
          >
            🚪 Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
