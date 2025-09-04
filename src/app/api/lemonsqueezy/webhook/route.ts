import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

interface LemonSqueezyWebhookData {
  data: {
    id: string
    type: string
    attributes: {
      status: string
      variant_id: string
      created_at: string
      renews_at: string
      user_email: string
      test_mode: boolean
    }
  }
  meta: {
    custom_data?: {
      user_id?: string
    }
  }
}

function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch {
    return false
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook endpoint is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Webhook received:', new Date().toISOString())
    console.log('🔔 Request method:', request.method)
    console.log('🔔 Request URL:', request.url)
    console.log('🔔 Request headers:', Object.fromEntries(request.headers.entries()))
    
    const body = await request.text()
    const signature = request.headers.get('x-signature') || request.headers.get('x-webhook-signature')
    
    console.log('📝 Request body length:', body.length)
    console.log('📝 Request body preview:', body.substring(0, 200) + '...')
    
    if (!signature) {
      console.log('❌ Missing signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const secret = process.env.LEMON_SQUEEZY_SIGNING_SECRET
    if (!secret) {
      console.error('❌ LEMON_SQUEEZY_SIGNING_SECRET not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    if (!verifySignature(body, signature, secret)) {
      console.log('❌ Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('✅ Signature verified successfully')

    const webhookData: LemonSqueezyWebhookData = JSON.parse(body)
    const { data, meta } = webhookData

    console.log('📊 Webhook data type:', data.type)
    console.log('📊 Webhook data:', JSON.stringify(data, null, 2))
    console.log('📊 Webhook meta:', JSON.stringify(meta, null, 2))

    // Only process subscription events (not invoice events)
    if (!data.type.includes('subscription') || data.type === 'subscription-invoices') {
      console.log('⏭️ Skipping non-subscription event or invoice event')
      return NextResponse.json({ ok: true })
    }

    const {
      id: subscriptionId,
      attributes: {
        status: rawStatus,
        variant_id: variantId,
        created_at: createdAt,
        renews_at: renewsAt,
        user_email: userEmail
      }
    } = data

    // Map Lemon Squeezy status to our internal status
    const status = rawStatus === 'on_trial' ? 'trial' : rawStatus

    // Try to get user_id from custom data first
    const customUserId = meta?.custom_data?.user_id

    console.log('👤 Processing subscription for email:', userEmail)
    console.log('🆔 Custom user ID:', customUserId)
    console.log('📅 Subscription status:', status)

    // Validate required fields
    if (!subscriptionId || !userEmail || !status) {
      console.error('❌ Missing required fields in webhook data')
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 })
    }

    let userId: string | undefined

    // First try to use the custom user_id if available
    if (customUserId) {
      console.log('🔍 Looking up user by custom user_id:', customUserId)
      
      // Verify this user exists in auth.users
      const { data: authUser, error: authError } = await supabaseAdmin().auth.admin.getUserById(customUserId)
      
      if (authError || !authUser.user) {
        console.error('❌ Custom user_id not found in auth:', authError?.message)
      } else {
        console.log('✅ Found user by custom user_id')
        userId = customUserId
        
        // Ensure profile exists
        const { error: profileError } = await supabaseAdmin()
          .from('profiles')
          .upsert({
            id: userId,
            email: userEmail,
            created_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })
        
        if (profileError) {
          console.error('❌ Failed to upsert profile:', profileError)
        } else {
          console.log('✅ Profile upserted successfully')
        }
      }
    }

    // Fallback to email lookup if custom user_id didn't work
    if (!userId) {
      console.log('🔍 Looking up user by email:', userEmail)
      const { data: userData, error: userError } = await supabaseAdmin()
        .from('profiles')
        .select('id')
        .eq('email', userEmail)
        .single()

      if (userError || !userData) {
        console.error('❌ User not found for email:', userEmail)
        
        // For Lemon Squeezy direct signups, we need to create the auth user first
        console.log('🔄 Attempting to create auth user for email:', userEmail)
        
        // Create auth user with a temporary password
        const tempPassword = crypto.randomUUID() // Generate a random password
        const { data: authData, error: authError } = await supabaseAdmin().auth.admin.createUser({
          email: userEmail,
          password: tempPassword,
          email_confirm: true // Auto-confirm the email
        })

        if (authError) {
          console.error('❌ Failed to create auth user:', authError)
          return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 })
        }

        console.log('✅ Created auth user for email:', userEmail)
        userId = authData.user.id

        // Now create the profile
        const { error: profileError } = await supabaseAdmin()
          .from('profiles')
          .insert({
            id: userId,
            email: userEmail,
            created_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('❌ Failed to create profile:', profileError)
          return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
        }
        console.log('✅ Created profile for email:', userEmail)
      } else {
        userId = userData.id
      }
    }
    
    if (!userId) {
      console.error('❌ Failed to determine user ID')
      return NextResponse.json({ error: 'Failed to determine user ID' }, { status: 500 })
    }
    
    console.log('👤 Found user ID:', userId)

    // Parse dates
    const startedAt = new Date(createdAt).toISOString()
    const currentPeriodEnd = renewsAt ? new Date(renewsAt).toISOString() : null

    console.log('📅 Parsed dates:', { startedAt, currentPeriodEnd, originalRenewsAt: renewsAt })

    console.log('💾 Upserting subscription data to database...')

    // First, check if subscription exists
    const { data: existingSub, error: checkError } = await supabaseAdmin()
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error checking existing subscription:', checkError.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (existingSub) {
      // Update existing subscription
      const { error: updateError } = await supabaseAdmin()
        .from('subscriptions')
        .update({
          variant_id: variantId,
          status: status,
          started_at: startedAt,
          current_period_end: currentPeriodEnd
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('❌ Update error:', updateError.message)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
      
      console.log('✅ Updated existing subscription')
    } else {
      // Create new subscription
      const { error: createError } = await supabaseAdmin()
        .from('subscriptions')
        .insert({
          id: subscriptionId,
          user_id: userId,
          variant_id: variantId,
          status: status,
          started_at: startedAt,
          current_period_end: currentPeriodEnd
        })

      if (createError) {
        console.error('❌ Create error:', createError.message)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
      
      console.log('✅ Created new subscription')
    }

    console.log('✅ Subscription data saved successfully')

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('❌ Webhook processing error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
