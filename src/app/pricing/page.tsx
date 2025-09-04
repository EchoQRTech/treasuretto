'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function PricingPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  const handleUpgrade = async () => {
    setLoading(true)
    
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // User is logged in, redirect to our custom payment page
        router.push('/checkout/custom')
      } else {
        // User not logged in, redirect to auth page
        router.push('/auth')
      }
    } catch (error) {
      console.error('Error handling upgrade:', error)
      // Fallback to auth page
      router.push('/auth')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Choose Your Plan
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Unlock the vault and access exclusive content
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Free Plan */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">Free</h3>
              <div className="mt-4">
                <span className="text-4xl font-extrabold text-gray-900">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="mt-4 text-gray-600">Basic access to get you started</p>
            </div>
            
            <ul className="mt-8 space-y-4">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 text-gray-700">Limited content access</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 text-gray-700">Basic features</span>
              </li>
            </ul>
            
            <div className="mt-8">
                             <Link
                 href="/signup"
                 className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
               >
                 Get Started
               </Link>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-indigo-500 relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span className="bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">Pro</h3>
              <div className="mt-4">
                <span className="text-4xl font-extrabold text-gray-900">$25</span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="mt-4 text-gray-600">Full access to the vault</p>
            </div>
            
            <ul className="mt-8 space-y-4">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 text-gray-700">Full content access</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 text-gray-700">Premium features</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 text-gray-700">Priority support</span>
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 text-gray-700">7-day trial for $1</span>
              </li>
            </ul>
            
            <div className="mt-8">
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Upgrade to Pro'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
                     <p className="text-gray-600">
             Already have an account?{' '}
             <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
               Sign in here
             </Link>
           </p>
        </div>
      </div>
    </div>
  )
}
