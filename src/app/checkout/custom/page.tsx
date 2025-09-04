'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { CreditCard, Lock, CheckCircle, Loader2, AlertTriangle } from 'lucide-react'
import { User } from '@supabase/supabase-js'

export default function CustomCheckoutPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [showEmbeddedCheckout, setShowEmbeddedCheckout] = useState(false)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
    }
    
    getUser()
  }, [supabase, router])

  // Listen for Lemon Squeezy checkout completion
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'lemonsqueezy:checkout:completed') {
        console.log('✅ Lemon Squeezy checkout completed')
        router.push('/checkout/success')
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [router])

  const handlePayment = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Call your payment API to create embedded checkout
      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          variantId: '944570'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Payment failed')
      }

      const result = await response.json()
      
      if (result.success) {
        // Show embedded checkout
        setCheckoutUrl(result.checkoutUrl)
        setShowEmbeddedCheckout(true)
      } else {
        setError(result.error || 'Payment failed')
      }

    } catch (err) {
      setError('Payment failed. Please try again.')
      console.error('Payment error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 text-indigo-600 animate-spin" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show embedded checkout iframe
  if (showEmbeddedCheckout && checkoutUrl) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-white">Complete Your Purchase</h1>
                <Lock className="h-5 w-5 text-indigo-200" />
              </div>
            </div>

            {/* Embedded Checkout */}
            <div className="p-6">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Secure Payment</h2>
                <p className="text-gray-600">Complete your purchase below</p>
              </div>
              
              <div className="w-full h-[600px] border border-gray-200 rounded-lg overflow-hidden">
                <iframe
                  src={checkoutUrl}
                  className="w-full h-full"
                  title="Lemon Squeezy Checkout"
                  frameBorder="0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-white">Complete Your Purchase</h1>
              <Lock className="h-5 w-5 text-indigo-200" />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            {/* Plan Details */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">The Vault Subscription</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Monthly Plan</h3>
                    <p className="text-gray-600">Access to all premium features</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">$25</div>
                    <div className="text-sm text-gray-500">per month</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Unlimited spreadsheet downloads</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Premium analytics and insights</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Priority customer support</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">Early access to new features</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ready to Get Started?</h3>
                <p className="text-gray-600 mb-6">
                  Click the button below to complete your purchase securely through Lemon Squeezy.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Pay $25/month
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => router.push('/pricing')}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Back to Pricing
                </button>
              </div>

              {/* Security Notice */}
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Your payment is secured by SSL encryption. You can cancel your subscription at any time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
