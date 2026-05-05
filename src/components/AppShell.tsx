'use client'

import { useState } from 'react'
import SidebarNav from './SidebarNav'
import LogoutButton from './LogoutButton'
import type { Property } from '@/lib/types'

interface Props {
  properties: Property[]
  userName: string
  userEmail: string
  children: React.ReactNode
}

export default function AppShell({ properties, userName, userEmail, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar — drawer on mobile, in-flow on desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col shrink-0
        transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0 md:z-auto
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center font-bold text-base">C</div>
            <span className="font-bold text-lg tracking-tight">CheckIn</span>
          </div>
        </div>

        <SidebarNav properties={properties} onLinkClick={() => setMobileOpen(false)} />

        <div className="p-4 border-t border-slate-800 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
              {userName?.[0] || 'U'}
            </div>
            <div className="text-sm flex-1 min-w-0">
              <p className="font-medium truncate">{userName || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">{userEmail}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center h-14 px-4 border-b border-gray-100 bg-white shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-slate-700 transition-colors"
            aria-label="Abrir menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="ml-3 font-bold text-slate-900">CheckIn</span>
        </div>

        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
