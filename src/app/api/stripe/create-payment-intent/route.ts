import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(request: Request) {
  try {
    const { amount, currency, metadata } = await request.json()

    if (!amount || amount < 50) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400, headers: CORS })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency ?? 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: metadata ?? {},
    })

    return NextResponse.json(
      { clientSecret: paymentIntent.client_secret },
      { headers: CORS }
    )
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500, headers: CORS }
    )
  }
}
