import Stripe from 'stripe'
import { supabaseAdmin, supabase } from '@/lib/supabase'

const db = supabaseAdmin ?? supabase

export default async function PaySuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ reservationId: string }>
  searchParams: Promise<{ session_id?: string }>
}) {
  const { reservationId } = await params
  const { session_id } = await searchParams

  let paid = false
  if (session_id) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      const session = await stripe.checkout.sessions.retrieve(session_id)
      if (session.payment_status === 'paid') {
        await db
          .from('checkin_records')
          .update({ tax_payment_method: 'online', updated_at: new Date().toISOString() })
          .eq('reservation_id', reservationId)
        paid = true
      }
    } catch {}
  }

  return (
    <div className="min-h-screen bg-[#18160f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        {paid ? (
          <>
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-white text-2xl font-bold mb-2">¡Pago completado!</h1>
            <p className="text-slate-400 text-sm">La tasa turística ha sido registrada. ¡Gracias!</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-white text-xl font-bold mb-2">No se pudo verificar el pago</h1>
            <p className="text-slate-400 text-sm">Por favor contacta con el alojamiento.</p>
          </>
        )}
      </div>
    </div>
  )
}
