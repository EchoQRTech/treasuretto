import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { TOTP } from '@/lib/totp'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const secret = TOTP.generateSecret()
    const backupCodes = TOTP.generateBackupCodes(8)
    const otpauthUrl = TOTP.generateQRUrl(secret, user.email || user.id)

    const { data: twoFAData, error: upsertError } = await supabase
      .from('two_factor_auth')
      .upsert({
        user_id: user.id,
        secret_key: secret,
        backup_codes: backupCodes,
        is_enabled: false
      }, { onConflict: 'user_id' })
      .select()
      .single()

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({
      secret,
      backup_codes: backupCodes,
      otpauth_url: otpauthUrl,
      two_factor_auth: twoFAData
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to setup 2FA' }, { status: 500 })
  }
}
