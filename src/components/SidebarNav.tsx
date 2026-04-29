'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Property } from '@/lib/types'

export default function SidebarNav({ properties }: { properties: Property[] }) {
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider px-3 mb-3">
        Propiedades
      </p>
      {properties.map(p => {
        const href = `/dashboard/${p.id}`
        const active = isActive(href)
        return (
          <Link
            key={p.id}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              active
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full shrink-0 bg-blue-500" />
            <span className="text-sm truncate">{p.name}</span>
          </Link>
        )
      })}

      <div className="pt-4 mt-4 border-t border-slate-800 space-y-1">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
            pathname === '/dashboard'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="text-sm">Resumen</span>
        </Link>

        <Link
          href="/dashboard/settings/properties"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
            isActive('/dashboard/settings/properties')
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm">Propiedades</span>
        </Link>
      </div>
    </nav>
  )
}
