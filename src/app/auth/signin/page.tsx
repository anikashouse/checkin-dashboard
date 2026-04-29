import { Suspense } from 'react'
import { SignInForm } from './form'

export default function SignIn() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Suspense fallback={<div className="text-white">Cargando...</div>}>
        <SignInForm />
      </Suspense>
    </div>
  )
}
