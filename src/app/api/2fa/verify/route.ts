import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { TOTP } from '@/lib/totp'

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const code: string | undefined = body.code

  if (!code || typeof code !== 'string' || code.length !== 6) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  const { data: twoFA } = await supabase
    .from('two_factor_auth')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!twoFA) {
    return NextResponse.json({ error: '2FA not initialized' }, { status: 400 })
  }

  const valid = TOTP.verifyCode(twoFA.secret_key as string, code)
  if (!valid) {
    return NextResponse.json({ ok: false, valid: false }, { status: 200 })
  }

  const { error: updateError } = await supabase
    .from('two_factor_auth')
    .update({ is_enabled: true })
    .eq('user_id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const res = NextResponse.json({ ok: true, valid: true })
  // Mark 2FA as verified for this session (30 minutes)
  res.cookies.set('two_factor_ok', '1', {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 30
  })
  return res
}
