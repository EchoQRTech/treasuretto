import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, variantId } = await request.json()
    
    if (!userId || !variantId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the user ID matches the authenticated user
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('💳 Creating Lemon Squeezy embedded checkout for user:', userId)

    // Create Lemon Squeezy embedded checkout session
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success`
    
    const checkoutData = {
      data: {
        type: 'checkouts',
        attributes: {
          store_id: parseInt(process.env.LEMON_SQUEEZY_STORE_ID || '0'),
          variant_id: parseInt(variantId),
          checkout_data: {
            email: user.email,
            custom: {
              user_id: userId
            }
          },
          success_url: successUrl,
          redirect_url: successUrl
        }
      }
    }

    console.log('🔑 Using API key:', process.env.LEMON_SQUEEZY_API_KEY ? 'Present' : 'Missing')
    console.log('🏪 Store ID:', process.env.LEMON_SQUEEZY_STORE_ID)

    // Call Lemon Squeezy API to create embedded checkout
    const lemonResponse = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`
      },
      body: JSON.stringify(checkoutData)
    })

    if (!lemonResponse.ok) {
      const errorData = await lemonResponse.json()
      console.error('❌ Lemon Squeezy API error:', errorData)
      return NextResponse.json({ error: `Payment processing failed: ${errorData.errors?.[0]?.detail || 'Unknown error'}` }, { status: 500 })
    }

    const lemonData = await lemonResponse.json()
    const checkoutUrl = lemonData.data.attributes.url
    const checkoutId = lemonData.data.id

    console.log('✅ Lemon Squeezy embedded checkout created:', checkoutUrl)
    console.log('🆔 Checkout ID:', checkoutId)
    
    return NextResponse.json({ 
      success: true,
      checkoutUrl: checkoutUrl,
      checkoutId: checkoutId,
      message: 'Embedded checkout session created'
    })

  } catch (error) {
    console.error('❌ Payment processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
