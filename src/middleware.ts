import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Ensure CSRF token cookie exists (non-HttpOnly so client can mirror in header)
  try {
    const csrfCookie = request.cookies.get('csrf_token')?.value
    if (!csrfCookie) {
      const maybeCrypto = (globalThis as unknown as { crypto?: { randomUUID?: () => string } }).crypto
      const token = maybeCrypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
      res.cookies.set('csrf_token', token, {
        path: '/',
        sameSite: 'lax',
        secure: true
      })
    }
  } catch {}

  // IP blacklist enforcement
  try {
    const fwd = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip')
    const ip = (fwd?.split(',')[0]?.trim()) || realIp || '0.0.0.0'
    const { data: blocked } = await supabase
      .from('ip_blacklist')
      .select('ip_address, expires_at')
      .eq('ip_address', ip)
      .maybeSingle()

    if (blocked && (!blocked.expires_at || new Date(blocked.expires_at) > new Date())) {
      return new NextResponse('Access blocked', { status: 403 })
    }
  } catch {}

  // CSRF protection for mutating API routes (exclude webhook and checkout)
  if (request.nextUrl.pathname.startsWith('/api/') && 
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) &&
      !request.nextUrl.pathname.includes('/lemonsqueezy/webhook') &&
      !request.nextUrl.pathname.includes('/checkout/initialize') &&
      !request.nextUrl.pathname.includes('/payment/process')) {
    const csrfCookie = request.cookies.get('csrf_token')?.value
    const csrfHeader = request.headers.get('x-csrf-token')
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      return new NextResponse('Invalid CSRF token', { status: 403 })
    }
  }

  // 2FA enforcement for sensitive routes (vault, account, settings)
  if (request.nextUrl.pathname.startsWith('/vault/') ||
      request.nextUrl.pathname.startsWith('/account') ||
      request.nextUrl.pathname.startsWith('/settings')) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: tfa } = await supabase
        .from('two_factor_auth')
        .select('is_enabled')
        .eq('user_id', user.id)
        .single()

      if (tfa?.is_enabled) {
        const twoFAOk = request.cookies.get('two_factor_ok')?.value === '1'
        if (!twoFAOk) {
          return NextResponse.redirect(new URL('/two-factor-auth', request.url))
        }
      }
    }
  }

  // Enhanced security for checkout success page
  if (request.nextUrl.pathname === '/checkout/success') {
    try {
      // Get user session
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // Check for active subscription - if exists, allow access
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, created_at')
        .eq('user_id', user.id)
        .in('status', ['active', 'trial'])
        .single()

      if (subscription) {
        console.log('✅ User has active subscription or trial, allowing checkout success access')
        return res
      }

      // Check for recent subscription creation (within 10 minutes)
      const { data: recentSub } = await supabase
        .from('subscriptions')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (recentSub && recentSub.created_at) {
        const subAge = Date.now() - new Date(recentSub.created_at).getTime()
        if (subAge < 10 * 60 * 1000) { // Within 10 minutes
          console.log('✅ Recent subscription found, allowing checkout success access')
          return res
        }
      }

      // Check for valid payment session in cookies as fallback
      const paymentSession = request.cookies.get('lemon_squeezy_payment')?.value
      
      if (paymentSession) {
        try {
          const paymentData = JSON.parse(paymentSession)
          const now = Date.now()
          const sessionAge = now - paymentData.timestamp

          // Payment session must be less than 5 minutes old
          if (sessionAge <= 5 * 60 * 1000 && paymentData.userId === user.id) {
            console.log('✅ Valid payment session found')
            return res
          }
        } catch {
          // Invalid payment session, continue to redirect
        }
      }

      console.log('❌ No valid payment verification found, redirecting to pricing')
      return NextResponse.redirect(new URL('/pricing', request.url))

    } catch {
      return NextResponse.redirect(new URL('/pricing', request.url))
    }
  }

  // Enhanced security for vault routes
  if (request.nextUrl.pathname.startsWith('/vault/')) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // Check for active subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .in('status', ['active', 'trial'])
        .single()

      if (!subscription) {
        return NextResponse.redirect(new URL('/trial', request.url))
      }

    } catch {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/checkout/success',
    '/vault/:path*',
    '/api/:path*',
    '/account',
    '/settings'
  ]
}
