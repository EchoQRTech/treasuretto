import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { TOTP } from '@/lib/totp'
import { User, SupabaseClient } from '@supabase/supabase-js'

// Session configuration
const SESSION_CONFIG = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  maxConcurrentSessions: 5,
  inactivityTimeout: 30 * 60 * 1000, // 30 minutes
  requireReauthAfter: 7 * 24 * 60 * 60 * 1000, // 7 days
}

// Account lockout configuration
const LOCKOUT_CONFIG = {
  maxFailedAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  maxLockoutsPerHour: 3,
}

export class EnhancedAuthMiddleware {
  /**
   * Enhanced authentication check with session management
   */
  static async checkAuth(request: NextRequest): Promise<{
    authenticated: boolean
    user?: User
    sessionValid: boolean
    requiresReauth: boolean
    error?: string
  }> {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })

    try {
      // Get user session
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return { authenticated: false, sessionValid: false, requiresReauth: false }
      }

      // Check session age
      const sessionAge = Date.now() - (user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0)
      const requiresReauth = sessionAge > SESSION_CONFIG.requireReauthAfter

      // Check for account lockout
      const lockoutStatus = await this.checkAccountLockout(user.id, supabase)
      if (lockoutStatus.locked) {
        return {
          authenticated: false,
          sessionValid: false,
          requiresReauth: false,
          error: `Account temporarily locked. Try again in ${Math.ceil(lockoutStatus.remainingTime / 60000)} minutes.`
        }
      }

      // Check concurrent sessions
      const sessionCount = await this.getActiveSessionCount(user.id, supabase)
      if (sessionCount > SESSION_CONFIG.maxConcurrentSessions) {
        await this.terminateOldestSessions(user.id, SESSION_CONFIG.maxConcurrentSessions, supabase)
      }

      // Update last activity
      await this.updateLastActivity(user.id, request.headers.get('user-agent') || '', supabase)

      return {
        authenticated: true,
        user,
        sessionValid: true,
        requiresReauth
      }

    } catch (error) {
      console.error('Enhanced auth check error:', error)
      return { authenticated: false, sessionValid: false, requiresReauth: false }
    }
  }

  /**
   * Check if account is locked due to failed attempts
   */
  private static async checkAccountLockout(userId: string, supabase: SupabaseClient): Promise<{
    locked: boolean
    remainingTime: number
    failedAttempts: number
  }> {
    const { data: lockoutData } = await supabase
      .from('account_lockouts')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!lockoutData) {
      return { locked: false, remainingTime: 0, failedAttempts: 0 }
    }

    const now = Date.now()
    const lockoutExpiry = new Date(lockoutData.locked_until).getTime()

    if (now < lockoutExpiry) {
      return {
        locked: true,
        remainingTime: lockoutExpiry - now,
        failedAttempts: lockoutData.failed_attempts
      }
    }

    // Clear expired lockout
    await supabase
      .from('account_lockouts')
      .delete()
      .eq('user_id', userId)

    return { locked: false, remainingTime: 0, failedAttempts: 0 }
  }

  /**
   * Record failed login attempt
   */
  static async recordFailedAttempt(userId: string, ipAddress: string, supabase: SupabaseClient): Promise<void> {
    const { data: existing } = await supabase
      .from('account_lockouts')
      .select('*')
      .eq('user_id', userId)
      .single()

    const failedAttempts = (existing?.failed_attempts || 0) + 1
    const lockedUntil = failedAttempts >= LOCKOUT_CONFIG.maxFailedAttempts 
      ? new Date(Date.now() + LOCKOUT_CONFIG.lockoutDuration)
      : null

    await supabase
      .from('account_lockouts')
      .upsert({
        user_id: userId,
        failed_attempts: failedAttempts,
        locked_until: lockedUntil,
        ip_address: ipAddress,
        last_attempt: new Date().toISOString()
      })

    // Log security event
    await supabase.rpc('log_security_event', {
      p_user_id: userId,
      p_event_type: 'failed_login',
      p_severity: 'medium',
      p_details: { failed_attempts: failedAttempts, ip_address: ipAddress },
      p_ip_address: ipAddress,
      p_user_agent: 'Unknown'
    })
  }

  /**
   * Clear failed attempts on successful login
   */
  static async clearFailedAttempts(userId: string, supabase: SupabaseClient): Promise<void> {
    await supabase
      .from('account_lockouts')
      .delete()
      .eq('user_id', userId)
  }

  /**
   * Get count of active sessions for user
   */
  private static async getActiveSessionCount(userId: string, supabase: SupabaseClient): Promise<number> {
    const { count } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true)

    return count || 0
  }

  /**
   * Terminate oldest sessions to maintain limit
   */
  private static async terminateOldestSessions(userId: string, keepCount: number, supabase: SupabaseClient): Promise<void> {
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('last_activity', { ascending: false })

    if (sessions && sessions.length > keepCount) {
      const sessionsToTerminate = sessions.slice(keepCount)
      const sessionIds = sessionsToTerminate.map(s => s.id)

      await supabase
        .from('user_sessions')
        .update({ is_active: false, terminated_at: new Date().toISOString() })
        .in('id', sessionIds)
    }
  }

  /**
   * Update last activity for session
   */
  private static async updateLastActivity(userId: string, userAgent: string, supabase: SupabaseClient): Promise<void> {
    await supabase
      .from('user_sessions')
      .update({ 
        last_activity: new Date().toISOString(),
        user_agent: userAgent
      })
      .eq('user_id', userId)
      .eq('is_active', true)
  }

  /**
   * Check if 2FA is required and verify code
   */
  static async verify2FA(userId: string, code: string, supabase: SupabaseClient): Promise<{
    valid: boolean
    error?: string
  }> {
    const { data: twoFactorData } = await supabase
      .from('two_factor_auth')
      .select('*')
      .eq('user_id', userId)
      .eq('is_enabled', true)
      .single()

    if (!twoFactorData) {
      return { valid: false, error: '2FA not enabled' }
    }

    // Check if it's a backup code
    if (code.length === 8) {
      const isValidBackup = TOTP.verifyBackupCode(code, twoFactorData.backup_codes as string[])
      if (isValidBackup) {
        // Remove used backup code
        const updatedCodes = (twoFactorData.backup_codes as string[]).filter((c: string) => c !== code.toUpperCase())
        await supabase
          .from('two_factor_auth')
          .update({ backup_codes: updatedCodes })
          .eq('user_id', userId)
        
        return { valid: true }
      }
    }

    // Verify TOTP code
    const isValidTOTP = TOTP.verifyCode(twoFactorData.secret_key, code)
    
    if (!isValidTOTP) {
      // Record failed 2FA attempt
      await supabase.rpc('log_security_event', {
        p_user_id: userId,
        p_event_type: 'failed_2fa',
        p_severity: 'high',
        p_details: { code_length: code.length },
        p_ip_address: 'Unknown',
        p_user_agent: 'Unknown'
      })
    }

    return { valid: isValidTOTP }
  }
}
