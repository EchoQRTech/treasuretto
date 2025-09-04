'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import {
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Eye,
  Lock,
  Key,
  Smartphone
} from 'lucide-react'

interface SecurityMetrics {
  total_users: number
  active_subscriptions: number
  failed_login_attempts: number
  suspicious_activities: number
  rate_limit_violations: number
  two_factor_enabled: number
  active_sessions: number
  recent_security_events: SecurityEvent[]
}

interface SecurityEvent {
  id: string
  user_id: string | null
  event_type: string
  severity: string
  details: Record<string, unknown>
  ip_address: string
  user_agent: string
  created_at: string
}

export default function SecurityAnalyticsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h')

  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        await loadSecurityMetrics()
      }
      setLoading(false)
    }

    getUser()
  }, [supabase, timeRange])

  const loadSecurityMetrics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_security_metrics')
      
      if (error) throw error
      
      setMetrics(data)
    } catch (error) {
      console.error('Failed to load security metrics:', error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/20'
      case 'high': return 'text-orange-400 bg-orange-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20'
      case 'low': return 'text-green-400 bg-green-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'failed_login': return <AlertTriangle className="w-4 h-4" />
      case 'successful_access': return <CheckCircle className="w-4 h-4" />
      case 'rate_limit_exceeded': return <Clock className="w-4 h-4" />
      case 'unauthorized_access': return <Lock className="w-4 h-4" />
      case '2fa_required': return <Smartphone className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
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
          <p className="text-gray-400">Please sign in to access this page.</p>
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
              <div className="w-8 h-8 bg-gradient-to-r from-red-400 to-orange-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-bold">Security Analytics</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '24h' | '7d' | '30d')}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold">{metrics?.total_users || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Subscriptions</p>
                <p className="text-2xl font-bold">{metrics?.active_subscriptions || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Failed Logins</p>
                <p className="text-2xl font-bold">{metrics?.failed_login_attempts || 0}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">2FA Enabled</p>
                <p className="text-2xl font-bold">{metrics?.two_factor_enabled || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Recent Security Events */}
          <div className="lg:col-span-2 bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h3 className="text-xl font-bold mb-6 flex items-center">
              <Activity className="w-6 h-6 mr-2" />
              Recent Security Events
            </h3>
            
            <div className="space-y-4">
              {metrics?.recent_security_events?.length ? (
                metrics.recent_security_events.map((event: SecurityEvent) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getSeverityColor(event.severity)}`}>
                        {getEventIcon(event.event_type)}
                      </div>
                      <div>
                        <p className="font-semibold capitalize">
                          {event.event_type.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(event.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(event.severity)}`}>
                        {event.severity}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-gray-400">No security events in the selected time range</p>
                </div>
              )}
            </div>
          </div>

          {/* Security Stats */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h3 className="text-xl font-bold mb-6 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2" />
              Security Stats
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-sm">Active Sessions</span>
                </div>
                <span className="font-semibold">{metrics?.active_sessions || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span className="text-sm">Rate Limit Violations</span>
                </div>
                <span className="font-semibold">{metrics?.rate_limit_violations || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span className="text-sm">Suspicious Activities</span>
                </div>
                <span className="font-semibold">{metrics?.suspicious_activities || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-sm">2FA Adoption Rate</span>
                </div>
                <span className="font-semibold">
                  {metrics?.total_users ? Math.round((metrics.two_factor_enabled / metrics.total_users) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Security Score */}
            <div className="mt-6 p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg border border-green-500/30">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">Overall Security Score</p>
                <p className="text-3xl font-bold text-green-400">95%</p>
                <p className="text-xs text-gray-400 mt-1">Excellent</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-gray-900 rounded-2xl p-6 border border-gray-800"
        >
          <h3 className="text-xl font-bold mb-6 flex items-center">
            <Shield className="w-6 h-6 mr-2" />
            Security Recommendations
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mt-1">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-400">Enable Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    Add an extra layer of security to your account with 2FA
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mt-1">
                  <Key className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-400">Use Strong Passwords</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    Ensure your password meets security requirements
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center mt-1">
                  <Eye className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-yellow-400">Monitor Account Activity</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    Regularly check your account for suspicious activity
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mt-1">
                  <Lock className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-purple-400">Secure Your Sessions</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    Log out from unused devices and clear browser data
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
