'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { 
  User as UserIcon, 
  CreditCard, 
  Settings, 
  LogOut, 
  Shield, 
  Bell, 
  Key,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Activity
} from 'lucide-react'

interface Subscription {
  id: string
  user_id: string | null
  variant_id: string | null
  status: string | null
  started_at: string | null
  current_period_end: string | null
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('account')
  const [updating, setUpdating] = useState(false)
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
        console.error('Settings page error:', error)
        setError('Failed to load user data')
      } finally {
        setLoading(false)
      }
    }
    
    getUser()
  }, [supabase, router])

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        setError('Failed to sign out')
      } else {
        router.push('/')
      }
    } catch (error) {
      setError('Failed to sign out')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getSubscriptionStatus = () => {
    if (!subscription) return { status: 'No subscription', color: 'text-gray-500' }
    
    switch (subscription.status) {
      case 'active':
        return { status: 'Active', color: 'text-green-500' }
      case 'trialing':
        return { status: 'Trial', color: 'text-blue-500' }
      case 'past_due':
        return { status: 'Past Due', color: 'text-red-500' }
      case 'canceled':
        return { status: 'Canceled', color: 'text-gray-500' }
      default:
        return { status: subscription.status || 'Unknown', color: 'text-gray-500' }
    }
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
          <p className="text-gray-400">Please sign in to access settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/vault/dashboard')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back to Dashboard
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <Settings className="w-6 h-6 mr-2" />
                Settings
              </h2>
              
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('account')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'account' 
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                                     <UserIcon className="w-5 h-5 mr-3" />
                   Account
                </button>
                
                <button
                  onClick={() => setActiveTab('subscription')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'subscription' 
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mr-3" />
                  Subscription
                </button>
                
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'security' 
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Shield className="w-5 h-5 mr-3" />
                  Security
                </button>
                
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'notifications' 
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Bell className="w-5 h-5 mr-3" />
                  Notifications
                </button>
              </nav>

              <div className="mt-8 pt-6 border-t border-gray-800">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center px-4 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
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

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
                <h3 className="text-2xl font-bold mb-6">Account Information</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Email Address
                    </label>
                    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <span className="text-white">{user.email}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Account Created
                    </label>
                    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <span className="text-white">{formatDate(user.created_at)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Email Verified
                    </label>
                    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="flex items-center">
                        {user.email_confirmed_at ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                            <span className="text-green-400">Verified</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2" />
                            <span className="text-yellow-400">Not verified</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Tab */}
            {activeTab === 'subscription' && (
              <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
                <h3 className="text-2xl font-bold mb-6">Subscription Management</h3>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Status
                      </label>
                      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            getSubscriptionStatus().color.replace('text-', 'bg-')
                          }`}></div>
                          <span className={getSubscriptionStatus().color}>
                            {getSubscriptionStatus().status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Started
                      </label>
                      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <span className="text-white">{formatDate(subscription?.started_at || null)}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Next Billing
                      </label>
                      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <span className="text-white">{formatDate(subscription?.current_period_end || null)}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Plan
                      </label>
                      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <span className="text-white">The Vault Pro</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-800">
                    <h4 className="text-lg font-semibold mb-4">Actions</h4>
                    <div className="space-y-3">
                      <button
                        onClick={() => window.open('https://treasurettovaultt.lemonsqueezy.com/account', '_blank')}
                        className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                      >
                        <CreditCard className="w-5 h-5 mr-2" />
                        Manage Billing
                      </button>
                      
                      <button
                        onClick={() => window.open('https://treasurettovaultt.lemonsqueezy.com/account', '_blank')}
                        className="w-full flex items-center justify-center px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        <Calendar className="w-5 h-5 mr-2" />
                        View Billing History
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
                <h3 className="text-2xl font-bold mb-6">Security Settings</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Password</h4>
                    <button
                      onClick={() => router.push('/forgot-password')}
                      className="flex items-center px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <Key className="w-5 h-5 mr-3" />
                      Change Password
                    </button>
                  </div>

                  <div className="pt-6 border-t border-gray-800">
                    <h4 className="text-lg font-semibold mb-4">Account Security</h4>
                    <div className="space-y-3">
                      <Link href="/two-factor-auth" className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <Shield className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Two-Factor Authentication</h3>
                            <p className="text-sm text-gray-400">Add an extra layer of security</p>
                          </div>
                        </div>
                        <div className="text-gray-400">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </Link>
                      
                      <Link href="/api-keys" className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <Key className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold">API Keys</h3>
                            <p className="text-sm text-gray-400">Manage your API access keys</p>
                          </div>
                        </div>
                        <div className="text-gray-400">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </Link>
                      
                      <Link href="/security-analytics" className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Security Analytics</h3>
                            <p className="text-sm text-gray-400">View security metrics and events</p>
                          </div>
                        </div>
                        <div className="text-gray-400">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </Link>
                      
                      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-white">Two-Factor Authentication</h5>
                            <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
                          </div>
                          <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors text-sm">
                            Coming Soon
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-white">Login Sessions</h5>
                            <p className="text-sm text-gray-400">Manage your active login sessions</p>
                          </div>
                          <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors text-sm">
                            Coming Soon
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
                <h3 className="text-2xl font-bold mb-6">Notification Preferences</h3>
                
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <div>
                        <h4 className="font-medium text-white">Email Notifications</h4>
                        <p className="text-sm text-gray-400">Receive updates about your subscription and account</p>
                      </div>
                      <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-sm">
                        Enabled
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <div>
                        <h4 className="font-medium text-white">Product Updates</h4>
                        <p className="text-sm text-gray-400">Get notified about new features and tools</p>
                      </div>
                      <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors text-sm">
                        Coming Soon
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <div>
                        <h4 className="font-medium text-white">Marketing Emails</h4>
                        <p className="text-sm text-gray-400">Receive promotional content and special offers</p>
                      </div>
                      <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors text-sm">
                        Coming Soon
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
