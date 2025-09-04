import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 1) Auth: require a signed-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2) Parse body
    const { userId, variantId } = await request.json()

    if (!userId || !variantId) {
      return NextResponse.json({ error: 'Missing required fields: userId, variantId' }, { status: 400 })
    }

    // 3) Verify request.userId matches the authenticated user
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 4) Basic env checks
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    if (!apiKey || !storeId) {
      return NextResponse.json(
        { error: 'Lemon Squeezy misconfigured: missing API key or store ID' },
        { status: 500 }
      )
    }

    const successUrl = `${appUrl}/checkout/success`

    // 5) Build JSON:API-compliant payload
    const checkoutPayload = {
      data: {
        type: 'checkouts',
        attributes: {
          // Opens as overlay with Lemon.js if you prefer (optional)
          checkout_options: { embed: true },

          // Where LS redirects AFTER a successful purchase
          product_options: {
            redirect_url: successUrl,
          },

          // Prefill & pass custom metadata
          checkout_data: {
            email: user.email ?? undefined,
            custom: { user_id: userId },
          },

          // Optionally include test mode if you want to force it
          // test_mode: process.env.NODE_ENV !== 'production',
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: String(storeId),
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: String(variantId), // must be a string for JSON:API
            },
          },
        },
      },
    }

    // 6) Call Lemon Squeezy with JSON:API headers
    const lemonResponse = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(checkoutPayload),
      // Recommended to avoid caching issues on some hosts
      cache: 'no-store',
    })

    const payload = await lemonResponse.json().catch(() => null)

    if (!lemonResponse.ok) {
      const detail =
        (payload as any)?.errors?.[0]?.detail ||
        (payload as any)?.errors?.[0]?.title ||
        'Unknown Lemon Squeezy error'
      console.error('❌ Lemon Squeezy API error:', payload)
      return NextResponse.json({ error: `Payment processing failed: ${detail}` }, { status: 500 })
    }

    // 7) Success: return the checkout URL + ID
    const checkoutUrl = (payload as any)?.data?.attributes?.url
    const checkoutId = (payload as any)?.data?.id

    if (!checkoutUrl) {
      console.error('Unexpected Lemon Squeezy response:', payload)
      return NextResponse.json({ error: 'Payment processing failed: missing checkout URL' }, { status: 500 })
    }

    console.log('✅ Lemon Squeezy embedded checkout created:', checkoutUrl)
    console.log('🆔 Checkout ID:', checkoutId)

    return NextResponse.json({
      success: true,
      checkoutUrl,
      checkoutId,
      message: 'Embedded checkout session created',
    })
  } catch (err) {
    console.error('❌ Payment processing error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
