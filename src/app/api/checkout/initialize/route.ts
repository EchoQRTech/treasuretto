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

    // Return checkout data (in a real implementation, you might call Lemon Squeezy's API here)
    const checkoutData = {
      variant_id: variantId,
      user_id: userId,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success`,
      custom_data: {
        user_id: userId
      }
    }

    console.log('✅ Checkout initialized for user:', userId)
    
    return NextResponse.json(checkoutData)

  } catch (error) {
    console.error('❌ Checkout initialization error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
