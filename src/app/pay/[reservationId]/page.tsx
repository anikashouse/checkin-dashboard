import { notFound, redirect } from 'next/navigation'
import Stripe from 'stripe'
import { supabaseAdmin, supabase } from '@/lib/supabase'

const db = supabaseAdmin ?? supabase
const APP_URL = 'https://checkin-dashboard-eight.vercel.app'
const TAX_RATE = 1.75

async function createSession(formData: FormData) {
  'use server'
  const reservationId = formData.get('reservationId') as string
  const grossCents    = parseInt(formData.get('grossCents') as string)
  const guests        = formData.get('guests') as string
  const nights        = formData.get('nights') as string
  const code          = formData.get('code') as string

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: grossCents,
        product_data: {
          name: 'Tasa turística',
          description: `${code} · ${guests} huéspedes · ${nights} noches`,
        },
      },
    }],
    payment_intent_data: {
      statement_descriptor_suffix: 'TASA TURISTICA',
      metadata: { reservationId, source: 'pay-link' },
    },
    success_url: `${APP_URL}/pay/${reservationId}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/pay/${reservationId}`,
  })
  redirect(session.url!)
}

export default async function PayPage({
  params,
}: {
  params: Promise<{ reservationId: string }>
}) {
  const { reservationId } = await params

  const { data: res } = await db
    .from('reservations')
    .select('id, airbnb_code, guests, nights, check_in, check_out, property_id')
    .eq('id', reservationId)
    .maybeSingle()

  if (!res) notFound()

  const { data: prop } = await db
    .from('properties')
    .select('name')
    .eq('id', res.property_id)
    .maybeSingle()

  const rawNights = res.nights ?? Math.ceil(
    (new Date(res.check_out).getTime() - new Date(res.check_in).getTime()) / 86400000
  )
  const nights    = Math.min(rawNights, 7)
  const guests    = res.guests ?? 1
  const netEur    = guests * nights * TAX_RATE
  const netCents  = Math.round(netEur * 100)
  const grossCents = Math.round((netCents + 25) / 0.985)
  const feeEur    = (grossCents - netCents) / 100

  const fmt = (d: string) => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[#18160f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <p className="text-[#C9A84C] text-xs font-semibold uppercase tracking-widest mb-2">{"Anika's House"}</p>
          <h1 className="text-white text-2xl font-bold">Tasa turística</h1>
          {prop?.name && <p className="text-slate-400 text-sm mt-1">{prop.name}</p>}
        </div>

        <div className="bg-[#242018] border border-[#3a3420] rounded-2xl p-5 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Reserva</span>
            <span className="text-white font-mono font-medium">{res.airbnb_code}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Entrada</span>
            <span className="text-white">{fmt(res.check_in)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Salida</span>
            <span className="text-white">{fmt(res.check_out)}</span>
          </div>
          <div className="border-t border-[#3a3420] pt-2 mt-2 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Huéspedes</span>
              <span className="text-white">{guests}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">
                Noches{rawNights > 7 ? ` (máx. 7 de ${rawNights})` : ''}
              </span>
              <span className="text-white">{nights}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">€1,75 × persona × noche</span>
              <span className="text-white">€{netEur.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Comisión de gestión online</span>
              <span className="text-slate-500">€{feeEur.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
          <div className="border-t border-[#3a3420] pt-2 mt-2 flex justify-between text-lg font-bold">
            <span className="text-white">Total</span>
            <span className="text-[#C9A84C]">€{(grossCents / 100).toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        <form action={createSession}>
          <input type="hidden" name="reservationId" value={reservationId} />
          <input type="hidden" name="grossCents"    value={grossCents} />
          <input type="hidden" name="guests"        value={guests} />
          <input type="hidden" name="nights"        value={nights} />
          <input type="hidden" name="code"          value={res.airbnb_code ?? ''} />
          <button
            type="submit"
            className="w-full py-3.5 bg-[#C9A84C] hover:bg-[#b8943d] text-[#18160f] font-bold rounded-xl text-sm transition-colors"
          >
            Pagar con tarjeta →
          </button>
        </form>

        <p className="text-center text-slate-500 text-xs mt-4">Pago seguro procesado por Stripe</p>
      </div>
    </div>
  )
}
