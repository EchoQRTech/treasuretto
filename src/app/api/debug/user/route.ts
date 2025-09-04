import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { user } = await getServerUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        user: null,
        subscription: null 
      }, { status: 401 })
    }

    // Get user profile using secure function
    const { data: profile, error: profileError } = await supabaseAdmin()
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get user subscription using secure function
    const { data: subscription, error: subscriptionError } = await supabaseAdmin()
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Check if user has active subscription
    const hasActiveSub = subscription?.status === 'active'

    // Get subscription status
    const subscriptionStatus = subscription?.status || 'trial'

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at
      },
      profile: profile || null,
      profileError: profileError?.message || null,
      subscription: subscription || null,
      subscriptionError: subscriptionError?.message || null,
      hasActiveSubscription: hasActiveSub,
      subscriptionStatus: subscriptionStatus,
      security: {
        isAdmin: false, // Will be implemented when admin check is available
        rateLimitRemaining: 'N/A', // Will be implemented with rate limiting
        lastAuditLog: null // Will be implemented when audit logs are accessible
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
