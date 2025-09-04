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

  if (!code || typeof code !== 'string' || code.length !== 8) {
    return NextResponse.json({ error: 'Invalid backup code' }, { status: 400 })
  }

  const { data: twoFA } = await supabase
    .from('two_factor_auth')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!twoFA) {
    return NextResponse.json({ error: '2FA not initialized' }, { status: 400 })
  }

  const valid = TOTP.verifyBackupCode(code, twoFA.backup_codes as string[])
  if (!valid) {
    return NextResponse.json({ ok: false, valid: false }, { status: 200 })
  }

  const updated = (twoFA.backup_codes as string[]).filter((c: string) => c !== code.toUpperCase())
  const { error: updateError } = await supabase
    .from('two_factor_auth')
    .update({ backup_codes: updated })
    .eq('user_id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, valid: true })
}
