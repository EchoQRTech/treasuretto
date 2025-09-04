import { NextRequest, NextResponse } from 'next/server'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // max 100 requests per minute
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
}

// Rate limit store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export interface SecurityConfig {
  requireAuth?: boolean
  requireSubscription?: boolean
  rateLimit?: {
    windowMs?: number
    maxRequests?: number
  }
  validateInput?: boolean
}

export class SecurityMiddleware {
  private config: SecurityConfig

  constructor(config: SecurityConfig = {}) {
    this.config = {
      requireAuth: true,
      requireSubscription: false,
      rateLimit: RATE_LIMIT_CONFIG,
      validateInput: true,
      ...config
    }
  }

  async handle(request: NextRequest): Promise<NextResponse | null> {
    try {
      // 1. Rate limiting check
      if (this.config.rateLimit) {
        const rateLimitResult = await this.checkRateLimit(request)
        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
            { status: 429 }
          )
        }
      }

      // 2. Authentication check
      if (this.config.requireAuth) {
        const authResult = await this.checkAuthentication(request)
        if (!authResult.authenticated) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        }
      }

      // 3. Subscription check
      if (this.config.requireSubscription) {
        const subscriptionResult = await this.checkSubscription(request)
        if (!subscriptionResult.hasActiveSubscription) {
          return NextResponse.json(
            { error: 'Active subscription required' },
            { status: 403 }
          )
        }
      }

      // 4. Input validation
      if (this.config.validateInput) {
        const validationResult = await this.validateInput(request)
        if (!validationResult.valid) {
          return NextResponse.json(
            { error: 'Invalid input', details: validationResult.errors },
            { status: 400 }
          )
        }
      }

      return null // Continue with request
    } catch (error) {
      console.error('Security middleware error:', error)
      return NextResponse.json(
        { error: 'Security check failed' },
        { status: 500 }
      )
    }
  }

  private async checkRateLimit(request: NextRequest): Promise<{ allowed: boolean; retryAfter?: number }> {
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
      return { allowed: true }
    }

    if (current.count >= maxRequests) {
      // Rate limit exceeded
      return { 
        allowed: false, 
        retryAfter: Math.ceil((current.resetTime - now) / 1000) 
      }
    }

    // Increment counter
    current.count++
    rateLimitStore.set(key, current)
    
    return { allowed: true }
  }

  private async checkAuthentication(request: NextRequest): Promise<{ authenticated: boolean; user?: unknown }> {
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

  private async checkSubscription(request: NextRequest): Promise<{ hasActiveSubscription: boolean }> {
    try {
      const supabase = createClientComponentClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { hasActiveSubscription: false }
      }

      // Use the secure function we created
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

    } catch (error) {
      errors.push('Input validation error')
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
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
}

// Utility functions for common security operations
export const SecurityUtils = {
  // Sanitize user input
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>"'&]/g, '')
      .trim()
  },

  // Validate email format
  validateEmail(email: string): boolean {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    return emailRegex.test(email)
  },

  // Generate secure random string
  generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  // Hash sensitive data (basic implementation - use proper hashing in production)
  hashData(data: string): string {
    return Buffer.from(data).toString('base64')
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
  }
}

// Pre-configured security middleware instances
export const securityMiddleware = {
  // Public endpoint with rate limiting
  public: new SecurityMiddleware({
    requireAuth: false,
    requireSubscription: false,
    rateLimit: { windowMs: 60 * 1000, maxRequests: 100 }
  }),

  // Authenticated endpoint
  authenticated: new SecurityMiddleware({
    requireAuth: true,
    requireSubscription: false,
    rateLimit: { windowMs: 60 * 1000, maxRequests: 50 }
  }),

  // Premium endpoint requiring subscription
  premium: new SecurityMiddleware({
    requireAuth: true,
    requireSubscription: true,
    rateLimit: { windowMs: 60 * 1000, maxRequests: 30 }
  }),

  // Admin endpoint
  admin: new SecurityMiddleware({
    requireAuth: true,
    requireSubscription: false,
    rateLimit: { windowMs: 60 * 1000, maxRequests: 20 }
  })
}

// Helper function to apply security middleware to API routes
export async function applySecurity(
  request: NextRequest,
  config: SecurityConfig = {}
): Promise<NextResponse | null> {
  const middleware = new SecurityMiddleware(config)
  return await middleware.handle(request)
}
