'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { CreditCard, Lock, CheckCircle, Loader2, AlertTriangle } from 'lucide-react'
import { User } from '@supabase/supabase-js'

interface CheckoutData {
  variant_id: string
  user_id: string
  success_url: string
  custom_data: {
    user_id: string
  }
}

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)
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
      
      // Initialize checkout session
      await initializeCheckout(user.id)
    }
    
    getUser()
  }, [supabase, router])

  const initializeCheckout = async (userId: string) => {
    try {
      setLoading(true)
      
      // Get CSRF token from cookie
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf_token='))
        ?.split('=')[1]

      const response = await fetch('/api/checkout/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken || '',
        },
        body: JSON.stringify({
          userId,
          variantId: '944570' // Your variant ID
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to initialize checkout')
      }

      const data = await response.json()
      setCheckoutData(data)
      
    } catch (err) {
      setError('Failed to initialize checkout')
      console.error('Checkout initialization error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!checkoutData || !user) return

    try {
      setLoading(true)
      setError(null)

      // Redirect to Lemon Squeezy's hosted checkout with our custom success URL
      const successUrl = `${window.location.origin}/checkout/success`
      const checkoutUrl = `https://treasurettovaultt.lemonsqueezy.com/checkout/buy/${checkoutData.variant_id}?checkout[success_url]=${encodeURIComponent(successUrl)}&custom[user_id]=${user.id}`
      
      window.location.href = checkoutUrl

    } catch (err) {
      setError('Payment failed. Please try again.')
      console.error('Payment error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !checkoutData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 text-indigo-600 animate-spin" />
          <p className="mt-2 text-gray-600">Initializing checkout...</p>
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

            {/* Payment Method */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-center">
                  <CreditCard className="h-6 w-6 text-gray-400 mr-3" />
                  <div>
                    <p className="text-gray-900 font-medium">Secure Payment</p>
                    <p className="text-sm text-gray-500">Your payment will be processed securely by Lemon Squeezy</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
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
                onClick={() => router.push('/pricing')}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Back to Pricing
              </button>
            </div>

            {/* Security Notice */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Your payment is secured by SSL encryption. You can cancel your subscription at any time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
