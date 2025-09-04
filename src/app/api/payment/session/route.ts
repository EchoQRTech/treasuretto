import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get user from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get payment data from request body
    const { subscriptionId, variantId, status } = await request.json()
    
    if (!subscriptionId || !variantId || !status) {
      return NextResponse.json({ error: 'Missing payment data' }, { status: 400 })
    }

    // Create secure payment session object
    const paymentSession = {
      userId: user.id,
      subscriptionId,
      variantId,
      status,
      timestamp: Date.now(),
      signature: crypto.createHmac('sha256', process.env.LEMON_SQUEEZY_SIGNING_SECRET || 'fallback')
        .update(`${user.id}-${subscriptionId}-${Date.now()}`)
        .digest('hex')
    }

    // Set HTTP-only cookie with payment session
    const response = NextResponse.json({ success: true })
    response.cookies.set('lemon_squeezy_payment', JSON.stringify(paymentSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 5 * 60, // 5 minutes
      path: '/'
    })

    console.log('✅ Payment session created for user:', user.id)
    
    return response

  } catch (error) {
    console.error('❌ Payment session creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
