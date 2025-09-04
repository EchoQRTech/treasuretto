'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react'

function CheckoutSuccessContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'verifying'>('loading')
  const [message, setMessage] = useState('Processing your subscription...')
  const [retryCount, setRetryCount] = useState(0)
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Enhanced security: Verify payment and session
  const verifyPaymentAndSession = async (user: User) => {
    try {
      // Check if user has an active subscription first
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'trial'])
        .single()

      if (subscription) {
        console.log('✅ User has active subscription or trial, payment verified')
        return { verified: true, subscription }
      }

      // If no active subscription, check for recent subscription creation
      const { data: recentSub, error: recentError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (recentSub && recentSub.created_at) {
        const subAge = Date.now() - new Date(recentSub.created_at).getTime()
        if (subAge < 10 * 60 * 1000) { // Within 10 minutes
          console.log('✅ Recent subscription found, payment verified')
          return { verified: true, subscription: recentSub }
        }
      }

      console.log('❌ No recent subscription found')
      return { verified: false, reason: 'No recent subscription' }
    } catch (error) {
      console.error('Payment verification error:', error)
      return { verified: false, reason: 'Verification error' }
    }
  }

  // Enhanced subscription verification with retry logic
  const verifySubscription = async (user: User, maxRetries = 5) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 Subscription verification attempt ${attempt}/${maxRetries}`)
        
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['active', 'trial'])
          .single()

        if (subError && subError.code !== 'PGRST116') {
          console.error('Subscription check error:', subError)
          throw subError
        }

        if (subscription) {
          console.log('✅ Active subscription verified')
          return { verified: true, subscription }
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 8000)
          console.log(`⏳ Waiting ${waitTime}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error)
        if (attempt === maxRetries) {
          throw error
        }
      }
    }

    return { verified: false, subscription: null }
  }

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        console.log('🔍 Checkout success page loaded')
        
        // Check if user is authenticated
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        console.log('👤 User check:', { user: user?.id, error: userError?.message })
        
        if (userError) {
          console.error('Auth error:', userError)
          setStatus('error')
          setMessage('Authentication error. Please try logging in.')
          return
        }

        if (!user) {
          console.log('❌ User not authenticated')
          setStatus('error')
          setMessage('Please log in to access your subscription.')
          setTimeout(() => {
            router.push('/login')
          }, 3000)
          return
        }

        // Enhanced security: Verify payment session
        setStatus('verifying')
        setMessage('Verifying payment...')
        
        const paymentVerification = await verifyPaymentAndSession(user)
        if (!paymentVerification.verified) {
          console.log('❌ Payment verification failed:', paymentVerification.reason)
          setStatus('error')
          setMessage('Payment verification failed. Please contact support.')
          setTimeout(() => {
            router.push('/pricing')
          }, 5000)
          return
        }

        // Enhanced subscription verification
        setMessage('Verifying your subscription...')
        const subscriptionVerification = await verifySubscription(user)
        
        if (subscriptionVerification.verified) {
          console.log('✅ All verifications passed')
          setStatus('success')
          setMessage('Subscription activated successfully!')
          
          // Clear payment session after successful verification
          // (Middleware will handle this)
          
          setTimeout(() => {
            router.push('/vault/dashboard')
          }, 2000)
        } else {
          console.log('❌ Subscription verification failed after all attempts')
          setStatus('error')
          setMessage('Subscription verification failed. Please contact support.')
          setTimeout(() => {
            router.push('/pricing')
          }, 5000)
        }

      } catch (error) {
        console.error('Success page error:', error)
        setStatus('error')
        setMessage('Something went wrong. Please contact support.')
        setTimeout(() => {
          router.push('/pricing')
        }, 5000)
      }
    }

    handleSuccess()
  }, [supabase, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="mx-auto h-12 w-12 text-indigo-600 animate-spin" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Processing Payment
              </h2>
            </>
          )}
          
          {status === 'verifying' && (
            <>
              <Loader2 className="mx-auto h-12 w-12 text-yellow-600 animate-spin" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Verifying Payment
              </h2>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Payment Successful!
              </h2>
            </>
          )}
          
          {status === 'error' && (
            <>
              <AlertTriangle className="mx-auto h-12 w-12 text-red-600" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Verification Failed
              </h2>
            </>
          )}
          
          <p className="mt-2 text-center text-sm text-gray-600">
            {message}
          </p>
          
          {status === 'success' && (
            <div className="mt-4">
              <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100">
                Redirecting to dashboard...
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="mt-4 space-y-2">
              <button
                onClick={() => router.push('/login')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Login
              </button>
              <button
                onClick={() => router.push('/pricing')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Pricing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 text-indigo-600 animate-spin" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Loading...
            </h2>
          </div>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
