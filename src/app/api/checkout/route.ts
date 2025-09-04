import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase'

export async function POST() {
  try {
    const { user } = await getServerUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const variantId = process.env.LEMON_SQUEEZY_BASIC_PLAN_ID
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL

    if (!variantId || !storeId || !siteUrl) {
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
    }

    // Create checkout URL with user_id in custom fields
    const checkoutUrl = `https://app.lemonsqueezy.com/checkout/buy/${variantId}?store=${storeId}&embed=true&checkout[success_url]=${encodeURIComponent(siteUrl + '/dashboard')}&custom[user_id]=${user.id}`

    return NextResponse.json({ checkoutUrl })

  } catch (error) {
    console.error('Checkout generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
