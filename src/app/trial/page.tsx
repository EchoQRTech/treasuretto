'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { 
  Clock, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  ArrowLeft,
  Loader2,
  Crown
} from 'lucide-react'

interface Subscription {
  id: string
  user_id: string | null
  variant_id: string | null
  status: string | null
  started_at: string | null
  current_period_end: string | null
}

export default function TrialManagementPage() {
  const [user, setUser] = useState<User | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error('User error:', userError)
          router.push('/login')
          return
        }

        if (!user) {
          router.push('/login')
          return
        }

        setUser(user)
        
        // Get subscription data
        const { data: subData, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (subError && subError.code !== 'PGRST116') {
          console.error('Subscription error:', subError)
        }

        setSubscription(subData)
      } catch (error) {
        console.error('Trial management error:', error)
        setError('Failed to load user data')
      } finally {
        setLoading(false)
      }
    }
    
    getUser()
  }, [supabase, router])

  const handleUpgrade = async () => {
    setUpgrading(true)
    setError(null)
    setMessage(null)

    if (!user) {
      setError('User not found')
      setUpgrading(false)
      return
    }

    try {
              const checkoutUrl = `https://treasurettovaultt.lemonsqueezy.com/buy/944570?checkout[success_url]=${encodeURIComponent(window.location.origin + '/checkout/success')}&custom[user_id]=${user.id}`
      window.location.href = checkoutUrl
    } catch (err) {
      setError('Failed to redirect to checkout')
      setUpgrading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysRemaining = () => {
    if (!subscription?.current_period_end) return 0
    const endDate = new Date(subscription.current_period_end)
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const getTrialProgress = () => {
    if (!subscription?.started_at || !subscription?.current_period_end) return 0
    const startDate = new Date(subscription.started_at)
    const endDate = new Date(subscription.current_period_end)
    const now = new Date()
    
    const totalDuration = endDate.getTime() - startDate.getTime()
    const elapsed = now.getTime() - startDate.getTime()
    
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">Please sign in to access trial management.</p>
        </div>
      </div>
    )
  }

  const daysRemaining = getDaysRemaining()
  const trialProgress = getTrialProgress()
  const isTrial = subscription?.status === 'trialing'
  const isActive = subscription?.status === 'active'

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/vault/dashboard')}
                className="text-gray-400 hover:text-white transition-colors flex items-center"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">{user.email?.charAt(0).toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-green-400">{message}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-red-400">{error}</span>
            </div>
          </div>
        )}

        {/* Trial Status Card */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mr-4">
                <Crown className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Trial Management</h1>
                <p className="text-gray-400">Manage your trial and subscription</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Status</div>
              <div className={`text-lg font-semibold ${
                isActive ? 'text-green-400' : isTrial ? 'text-blue-400' : 'text-gray-400'
              }`}>
                {isActive ? 'Active' : isTrial ? 'Trial' : 'No Subscription'}
              </div>
            </div>
          </div>

          {isTrial && (
            <div className="space-y-6">
              {/* Trial Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-400">Trial Progress</span>
                  <span className="text-sm text-gray-400">{Math.round(trialProgress)}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${trialProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Days Remaining */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center mb-2">
                    <Clock className="w-5 h-5 text-blue-400 mr-2" />
                    <span className="text-sm font-medium text-gray-400">Days Remaining</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{daysRemaining}</div>
                  <div className="text-sm text-gray-400">days left in trial</div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center mb-2">
                    <Calendar className="w-5 h-5 text-green-400 mr-2" />
                    <span className="text-sm font-medium text-gray-400">Trial Started</span>
                  </div>
                  <div className="text-sm font-medium text-white">{formatDate(subscription?.started_at)}</div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                    <span className="text-sm font-medium text-gray-400">Trial Ends</span>
                  </div>
                  <div className="text-sm font-medium text-white">{formatDate(subscription?.current_period_end)}</div>
                </div>
              </div>

              {/* Upgrade Warning */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
                <div className="flex items-start">
                  <AlertTriangle className="w-6 h-6 text-yellow-400 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                      Trial Ending Soon
                    </h3>
                    <p className="text-gray-300 mb-4">
                      Your trial will end in {daysRemaining} days. Upgrade now to continue accessing all the powerful tools in The Vault and avoid any interruption to your workflow.
                    </p>
                    <button
                      onClick={handleUpgrade}
                      disabled={upgrading}
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold rounded-lg hover:from-yellow-300 hover:to-orange-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {upgrading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mr-2" />
                          Upgrade Now - $25/month
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isActive && (
            <div className="space-y-6">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-green-400 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-400 mb-2">
                      Active Subscription
                    </h3>
                    <p className="text-gray-300 mb-4">
                      You have an active subscription to The Vault Pro. You have full access to all tools and features.
                    </p>
                    <button
                      onClick={() => window.open('https://treasurettovaultt.lemonsqueezy.com/account', '_blank')}
                      className="flex items-center px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      Manage Billing
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center mb-2">
                    <Calendar className="w-5 h-5 text-green-400 mr-2" />
                    <span className="text-sm font-medium text-gray-400">Next Billing</span>
                  </div>
                  <div className="text-sm font-medium text-white">{formatDate(subscription?.current_period_end)}</div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center mb-2">
                    <CreditCard className="w-5 h-5 text-blue-400 mr-2" />
                    <span className="text-sm font-medium text-gray-400">Plan</span>
                  </div>
                  <div className="text-sm font-medium text-white">The Vault Pro - $25/month</div>
                </div>
              </div>
            </div>
          )}

          {!isTrial && !isActive && (
            <div className="space-y-6">
              <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-6">
                <div className="flex items-start">
                  <AlertTriangle className="w-6 h-6 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-400 mb-2">
                      No Active Subscription
                    </h3>
                    <p className="text-gray-300 mb-4">
                      You don&apos;t have an active subscription. Upgrade to The Vault Pro to access all tools and features.
                    </p>
                    <button
                      onClick={handleUpgrade}
                      disabled={upgrading}
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold rounded-lg hover:from-yellow-300 hover:to-orange-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {upgrading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mr-2" />
                          Get Started - $25/month
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Features Comparison */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-2xl font-bold mb-6">What You Get with The Vault Pro</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-400">Current Access</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  <span className="text-gray-300">Limited tool access</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  <span className="text-gray-300">Basic features</span>
                </li>
                <li className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mr-3" />
                  <span className="text-gray-300">Trial period only</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">Pro Features</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  <span className="text-white">All 10+ reselling tools</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  <span className="text-white">AI-powered features</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  <span className="text-white">Premium spreadsheets</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  <span className="text-white">Priority support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  <span className="text-white">Regular updates</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
