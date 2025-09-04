import { NextRequest, NextResponse } from 'next/server'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import crypto from 'crypto'

// Advanced rate limiting configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // max 100 requests per minute
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
}

// In-memory rate limit store (fallback if Redis unavailable)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export interface SecurityConfig {
  requireAuth?: boolean
  requireSubscription?: boolean
  require2FA?: boolean
  rateLimit?: {
    windowMs?: number
    maxRequests?: number
  }
  validateInput?: boolean
  logSecurityEvents?: boolean
}

export interface SecurityEvent {
  eventType: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export class AdvancedSecurityMiddleware {
  private config: SecurityConfig

  constructor(config: SecurityConfig = {}) {
    this.config = {
      requireAuth: true,
      requireSubscription: false,
      require2FA: false,
      rateLimit: RATE_LIMIT_CONFIG,
      validateInput: true,
      logSecurityEvents: true,
      ...config
    }
  }

  async handle(request: NextRequest): Promise<NextResponse | null> {
    try {
      const clientIP = this.getClientIP(request)
      const userAgent = request.headers.get('user-agent') || 'unknown'

      // 1. Rate limiting check
      if (this.config.rateLimit) {
        const rateLimitResult = await this.checkRateLimit(request)
        if (!rateLimitResult.allowed) {
          await this.logSecurityEvent({
            eventType: 'rate_limit_exceeded',
            severity: 'medium',
            details: { endpoint: request.nextUrl.pathname, limit: this.config.rateLimit.maxRequests },
            ipAddress: clientIP,
            userAgent
          })
          
          return NextResponse.json(
            { 
              error: 'Rate limit exceeded', 
              retryAfter: rateLimitResult.retryAfter,
              remaining: rateLimitResult.remaining 
            },
            { status: 429 }
          )
        }
      }

      // 2. Authentication check
      if (this.config.requireAuth) {
        const authResult = await this.checkAuthentication(request)
        if (!authResult.authenticated) {
          await this.logSecurityEvent({
            eventType: 'unauthorized_access',
            severity: 'high',
            details: { endpoint: request.nextUrl.pathname },
            ipAddress: clientIP,
            userAgent
          })
          
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        }

        // 3. Two-Factor Authentication check
        if (this.config.require2FA && authResult.user) {
          const twoFactorResult = await this.checkTwoFactorAuth(authResult.user.id)
          if (!twoFactorResult.enabled) {
            await this.logSecurityEvent({
              eventType: '2fa_required',
              severity: 'medium',
              details: { userId: authResult.user.id },
              ipAddress: clientIP,
              userAgent
            })
            
            return NextResponse.json(
              { error: 'Two-factor authentication required' },
              { status: 403 }
            )
          }
        }
      }

      // 4. Subscription check
      if (this.config.requireSubscription) {
        const subscriptionResult = await this.checkSubscription(request)
        if (!subscriptionResult.hasActiveSubscription) {
          await this.logSecurityEvent({
            eventType: 'subscription_required',
            severity: 'low',
            details: { endpoint: request.nextUrl.pathname },
            ipAddress: clientIP,
            userAgent
          })
          
          return NextResponse.json(
            { error: 'Active subscription required' },
            { status: 403 }
          )
        }
      }

      // 5. Input validation
      if (this.config.validateInput) {
        const validationResult = await this.validateInput(request)
        if (!validationResult.valid) {
          await this.logSecurityEvent({
            eventType: 'invalid_input',
            severity: 'medium',
            details: { errors: validationResult.errors },
            ipAddress: clientIP,
            userAgent
          })
          
          return NextResponse.json(
            { error: 'Invalid input', details: validationResult.errors },
            { status: 400 }
          )
        }
      }

      // 6. Log successful access
      if (this.config.logSecurityEvents) {
        await this.logSecurityEvent({
          eventType: 'successful_access',
          severity: 'low',
          details: { endpoint: request.nextUrl.pathname },
          ipAddress: clientIP,
          userAgent
        })
      }

      return null // Continue with request
    } catch (error) {
      console.error('Advanced security middleware error:', error)
      return NextResponse.json(
        { error: 'Security check failed' },
        { status: 500 }
      )
    }
  }

  private async checkRateLimit(request: NextRequest): Promise<{ 
    allowed: boolean; 
    retryAfter?: number; 
    remaining?: number 
  }> {
    const clientIp = this.getClientIP(request)
    const endpoint = request.nextUrl.pathname
    const key = `${clientIp}:${endpoint}`
    
    const now = Date.now()
    const windowMs = this.config.rateLimit?.windowMs || RATE_LIMIT_CONFIG.windowMs
    const maxRequests = this.config.rateLimit?.maxRequests || RATE_LIMIT_CONFIG.maxRequests

    const current = rateLimitStore.get(key)
    
    if (!current || now > current.resetTime) {
      // First request or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return { allowed: true, remaining: maxRequests - 1 }
    }

    if (current.count >= maxRequests) {
      // Rate limit exceeded
      return { 
        allowed: false, 
        retryAfter: Math.ceil((current.resetTime - now) / 1000),
        remaining: 0
      }
    }

    // Increment counter
    current.count++
    rateLimitStore.set(key, current)
    
    return { allowed: true, remaining: maxRequests - current.count }
  }

  private async checkAuthentication(request: NextRequest): Promise<{ 
    authenticated: boolean; 
    user?: User 
  }> {
    try {
      const supabase = createClientComponentClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return { authenticated: false }
      }

      return { authenticated: true, user }
    } catch (error) {
      console.error('Authentication check error:', error)
      return { authenticated: false }
    }
  }

  private async checkTwoFactorAuth(userId: string): Promise<{ enabled: boolean }> {
    try {
      const supabase = createClientComponentClient()
      const { data, error } = await supabase
        .from('two_factor_auth')
        .select('is_enabled')
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        return { enabled: false }
      }

      return { enabled: data.is_enabled }
    } catch (error) {
      console.error('2FA check error:', error)
      return { enabled: false }
    }
  }

  private async checkSubscription(request: NextRequest): Promise<{ hasActiveSubscription: boolean }> {
    try {
      const supabase = createClientComponentClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { hasActiveSubscription: false }
      }

      const { data, error } = await supabase
        .rpc('has_active_subscription', { user_uuid: user.id })

      if (error) {
        console.error('Subscription check error:', error)
        return { hasActiveSubscription: false }
      }

      return { hasActiveSubscription: data || false }
    } catch (error) {
      console.error('Subscription check error:', error)
      return { hasActiveSubscription: false }
    }
  }

  private async validateInput(request: NextRequest): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = []

    try {
      // Check content type for POST/PUT requests
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const contentType = request.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          errors.push('Content-Type must be application/json')
        }
      }

      // Validate request size
      const contentLength = request.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
        errors.push('Request body too large')
      }

      // Check for suspicious headers
      const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-forwarded-proto']
      for (const header of suspiciousHeaders) {
        const value = request.headers.get(header)
        if (value && this.containsSuspiciousContent(value)) {
          errors.push(`Suspicious content in ${header} header`)
        }
      }

      // Validate URL parameters
      const url = request.nextUrl
      const searchParams = url.searchParams
      for (const [key, value] of searchParams.entries()) {
        if (this.containsSuspiciousContent(value)) {
          errors.push(`Suspicious content in query parameter: ${key}`)
        }
      }

      // Check for SQL injection patterns
      const body = await request.text().catch(() => '')
      if (this.containsSQLInjection(body)) {
        errors.push('Potential SQL injection detected')
      }

    } catch (error) {
      errors.push('Input validation error')
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  private async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const supabase = createClientComponentClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase.rpc('log_security_event', {
        p_user_id: user?.id || null,
        p_event_type: event.eventType,
        p_severity: event.severity,
        p_details: event.details,
        p_ip_address: event.ipAddress,
        p_user_agent: event.userAgent
      })
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }

  private getClientIP(request: NextRequest): string {
    // Get client IP from various headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    if (realIP) {
      return realIP
    }
    if (cfConnectingIP) {
      return cfConnectingIP
    }
    
    return 'unknown'
  }

  private containsSuspiciousContent(value: string): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload/i,
      /onerror/i,
      /onclick/i,
      /union\s+select/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /update\s+set/i,
      /exec\s*\(/i,
      /eval\s*\(/i,
      /document\.cookie/i,
      /window\.location/i,
      /localStorage/i,
      /sessionStorage/i
    ]

    return suspiciousPatterns.some(pattern => pattern.test(value))
  }

  private containsSQLInjection(value: string): boolean {
    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
      /(\b(and|or)\b\s+\d+\s*=\s*\d+)/i,
      /(\b(and|or)\b\s+['"]\w+['"]\s*=\s*['"]\w+['"])/i,
      /(\b(and|or)\b\s+\w+\s*=\s*\w+)/i,
      /(--|\/\*|\*\/)/,
      /(\bxp_cmdshell\b)/i,
      /(\bsp_executesql\b)/i
    ]

    return sqlPatterns.some(pattern => pattern.test(value))
  }
}

// Enhanced utility functions
export const AdvancedSecurityUtils = {
  // Generate secure random string
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  },

  // Hash data with salt
  hashData(data: string, salt?: string): string {
    const saltToUse = salt || crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(data, saltToUse, 1000, 64, 'sha512').toString('hex')
    return `${saltToUse}:${hash}`
  },

  // Verify hashed data
  verifyHash(data: string, hashedData: string): boolean {
    const [salt, hash] = hashedData.split(':')
    const computedHash = crypto.pbkdf2Sync(data, salt, 1000, 64, 'sha512').toString('hex')
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'))
  },

  // Generate TOTP secret
  generateTOTPSecret(): string {
    return crypto.randomBytes(20).toString('base64').replace(/[^A-Z2-7]/g, '').substring(0, 32)
  },

  // Validate email format
  validateEmail(email: string): boolean {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    return emailRegex.test(email)
  },

  // Sanitize user input
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>"'&]/g, '')
      .trim()
  },

  // Validate password strength
  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  },

  // Check if user is admin
  async isAdmin(userId: string): Promise<boolean> {
    try {
      const supabase = createClientComponentClient()
      const { data, error } = await supabase
        .rpc('is_admin', { user_uuid: userId })
      
      return !error && data === true
    } catch (error) {
      console.error('Admin check error:', error)
      return false
    }
  },

  // Get user subscription status
  async getUserSubscriptionStatus(userId: string): Promise<string> {
    try {
      const supabase = createClientComponentClient()
      const { data, error } = await supabase
        .rpc('get_user_subscription_status', { user_uuid: userId })
      
      return error ? 'trial' : (data || 'trial')
    } catch (error) {
      console.error('Subscription status check error:', error)
      return 'trial'
    }
  },

  // Create user session
  async createUserSession(
    userId: string,
    deviceInfo?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string,
    durationHours: number = 24
  ): Promise<string> {
    try {
      const supabase = createClientComponentClient()
      const { data, error } = await supabase.rpc('create_user_session', {
        p_user_id: userId,
        p_device_info: deviceInfo,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_duration_hours: durationHours
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Session creation error:', error)
      throw error
    }
  },

  // Validate session token
  async validateSessionToken(token: string): Promise<{
    userId: string | null
    isValid: boolean
    expiresAt: Date | null
  }> {
    try {
      const supabase = createClientComponentClient()
      const { data, error } = await supabase.rpc('validate_session_token', {
        token
      })

      if (error || !data || data.length === 0) {
        return { userId: null, isValid: false, expiresAt: null }
      }

      const session = data[0]
      return {
        userId: session.user_id,
        isValid: session.is_valid,
        expiresAt: session.expires_at ? new Date(session.expires_at) : null
      }
    } catch (error) {
      console.error('Session validation error:', error)
      return { userId: null, isValid: false, expiresAt: null }
    }
  },

  // Generate API key
  async generateApiKey(
    userId: string,
    keyName: string,
    permissions: string[] = [],
    expiresDays: number = 365
  ): Promise<string> {
    try {
      const supabase = createClientComponentClient()
      const { data, error } = await supabase.rpc('generate_api_key', {
        p_user_id: userId,
        p_key_name: keyName,
        p_permissions: permissions,
        p_expires_days: expiresDays
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('API key generation error:', error)
      throw error
    }
  },

  // Validate API key
  async validateApiKey(apiKey: string): Promise<{
    userId: string | null
    permissions: string[]
    isValid: boolean
  }> {
    try {
      const supabase = createClientComponentClient()
      const { data, error } = await supabase.rpc('validate_api_key', {
        api_key: apiKey
      })

      if (error || !data || data.length === 0) {
        return { userId: null, permissions: [], isValid: false }
      }

      const keyData = data[0]
      return {
        userId: keyData.user_id,
        permissions: keyData.permissions || [],
        isValid: keyData.is_valid
      }
    } catch (error) {
      console.error('API key validation error:', error)
      return { userId: null, permissions: [], isValid: false }
    }
  }
}

// Pre-configured security middleware instances
export const advancedSecurityMiddleware = {
  // Public endpoint with rate limiting
  public: new AdvancedSecurityMiddleware({
    requireAuth: false,
    requireSubscription: false,
    require2FA: false,
    rateLimit: { windowMs: 60 * 1000, maxRequests: 100 }
  }),

  // Authenticated endpoint
  authenticated: new AdvancedSecurityMiddleware({
    requireAuth: true,
    requireSubscription: false,
    require2FA: false,
    rateLimit: { windowMs: 60 * 1000, maxRequests: 50 }
  }),

  // Premium endpoint requiring subscription
  premium: new AdvancedSecurityMiddleware({
    requireAuth: true,
    requireSubscription: true,
    require2FA: false,
    rateLimit: { windowMs: 60 * 1000, maxRequests: 30 }
  }),

  // Admin endpoint
  admin: new AdvancedSecurityMiddleware({
    requireAuth: true,
    requireSubscription: false,
    require2FA: true,
    rateLimit: { windowMs: 60 * 1000, maxRequests: 20 }
  }),

  // High-security endpoint
  highSecurity: new AdvancedSecurityMiddleware({
    requireAuth: true,
    requireSubscription: true,
    require2FA: true,
    rateLimit: { windowMs: 60 * 1000, maxRequests: 10 }
  })
}

// Helper function to apply advanced security middleware to API routes
export async function applyAdvancedSecurity(
  request: NextRequest,
  config: SecurityConfig = {}
): Promise<NextResponse | null> {
  const middleware = new AdvancedSecurityMiddleware(config)
  return await middleware.handle(request)
}

// Add security headers to responses
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.supabase.co;"
  )
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  
  return response
}
