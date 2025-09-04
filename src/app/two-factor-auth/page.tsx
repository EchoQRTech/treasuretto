'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import {
  Shield,
  Smartphone,
  Key,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Copy,
  Download,
  Eye,
  EyeOff
} from 'lucide-react'
import Link from 'next/link'

interface TwoFactorAuth {
  id: string
  user_id: string
  secret_key: string
  backup_codes: string[]
  is_enabled: boolean
  created_at: string
}

export default function TwoFactorAuthPage() {
  const [user, setUser] = useState<User | null>(null)
  const [twoFactorAuth, setTwoFactorAuth] = useState<TwoFactorAuth | null>(null)
  const [loading, setLoading] = useState(true)
  const [setupLoading, setSetupLoading] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'setup' | 'verify' | 'backup' | 'complete'>('setup')

  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        
        const { data: twoFactorData } = await supabase
          .from('two_factor_auth')
          .select('*')
          .eq('user_id', user.id)
          .single()

        setTwoFactorAuth(twoFactorData)
        if (twoFactorData?.is_enabled) setStep('complete')
      }
      setLoading(false)
    }

    getUser()
  }, [supabase])

  const csrf = () => document.cookie.split('; ').find(x => x.startsWith('csrf_token='))?.split('=')[1]

  const setupTwoFactorAuth = async () => {
    setSetupLoading(true)
    setError(null)
    setMessage(null)

    try {
      const resp = await fetch('/api/2fa/setup', {
        method: 'POST',
        headers: { 'x-csrf-token': csrf() || '' }
      })
      const json = await resp.json()
      if (!resp.ok) throw new Error(json.error || 'Failed to setup 2FA')

      setTwoFactorAuth({
        id: json.two_factor_auth.id,
        user_id: json.two_factor_auth.user_id,
        secret_key: json.secret,
        backup_codes: json.backup_codes,
        is_enabled: false,
        created_at: json.two_factor_auth.created_at
      })
      setStep('verify')
      setMessage('Two-factor authentication setup initiated. Please verify with your authenticator app.')
    } catch (err) {
      setError('Failed to setup two-factor authentication')
      console.error('2FA setup error:', err)
    } finally {
      setSetupLoading(false)
    }
  }

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code')
      return
    }

    setSetupLoading(true)
    setError(null)

    try {
      const resp = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf() || '' },
        body: JSON.stringify({ code: verificationCode })
      })
      const json = await resp.json()
      if (!resp.ok || !json.valid) {
        setError('Invalid verification code. Please try again.')
        setSetupLoading(false)
        return
      }

      setTwoFactorAuth(prev => prev ? { ...prev, is_enabled: true } : null)
      setStep('backup')
      setMessage('Two-factor authentication enabled successfully!')
    } catch (err) {
      setError('Failed to verify and enable two-factor authentication')
      console.error('2FA verification error:', err)
    } finally {
      setSetupLoading(false)
    }
  }

  const verifyBackupCode = async () => {
    if (!backupCode || backupCode.length !== 8) {
      setError('Please enter a valid 8-digit backup code')
      return
    }

    setSetupLoading(true)
    setError(null)

    try {
      const resp = await fetch('/api/2fa/verify-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf() || '' },
        body: JSON.stringify({ code: backupCode })
      })
      const json = await resp.json()
      if (!resp.ok || !json.valid) {
        setError('Invalid backup code. Please try again.')
        setSetupLoading(false)
        return
      }

      setStep('complete')
      setMessage('Backup code verified successfully!')
    } catch (err) {
      setError('Failed to verify backup code')
      console.error('Backup code verification error:', err)
    } finally {
      setSetupLoading(false)
    }
  }

  const disableTwoFactorAuth = async () => {
    setSetupLoading(true)
    setError(null)

    try {
      const resp = await fetch('/api/2fa/disable', {
        method: 'POST',
        headers: { 'x-csrf-token': csrf() || '' }
      })
      if (!resp.ok) throw new Error('Failed to disable 2FA')

      setTwoFactorAuth(null)
      setMessage('Two-factor authentication disabled successfully.')
      setStep('setup')
    } catch (err) {
      setError('Failed to disable two-factor authentication')
      console.error('2FA disable error:', err)
    } finally {
      setSetupLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMessage('Copied to clipboard!')
    setTimeout(() => setMessage(null), 2000)
  }

  const downloadBackupCodes = () => {
    if (!twoFactorAuth?.backup_codes) return

    const codes = twoFactorAuth.backup_codes.join('\n')
    const blob = new Blob([codes], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'treasuretto-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/settings" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-bold">Two-Factor Authentication</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                twoFactorAuth?.is_enabled 
                  ? 'bg-green-500/20 border border-green-500/30' 
                  : 'bg-yellow-500/20 border border-yellow-500/30'
              }`}>
                {twoFactorAuth?.is_enabled ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-yellow-400" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {twoFactorAuth?.is_enabled ? 'Enabled' : 'Not Set Up'}
                </h2>
                <p className="text-gray-400">
                  {twoFactorAuth?.is_enabled 
                    ? 'Your account is protected with two-factor authentication'
                    : 'Add an extra layer of security to your account'
                  }
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Setup Flow */}
        {!twoFactorAuth?.is_enabled && step === 'setup' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 rounded-2xl p-6 border border-gray-800"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Set Up Two-Factor Authentication</h3>
              <p className="text-gray-400">
                Protect your account with an authenticator app like Google Authenticator or Authy
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-1">
                  <span className="text-sm font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold">Download an Authenticator App</h4>
                  <p className="text-gray-400 text-sm">
                    Install Google Authenticator, Authy, or any TOTP-compatible app
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-1">
                  <span className="text-sm font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold">Scan QR Code</h4>
                  <p className="text-gray-400 text-sm">
                    Use your app to scan the QR code we&apos;ll provide
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-1">
                  <span className="text-sm font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold">Verify Setup</h4>
                  <p className="text-gray-400 text-sm">
                    Enter the 6-digit code from your app to complete setup
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={setupTwoFactorAuth}
              disabled={setupLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {setupLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Shield className="w-5 h-5" />
              )}
              <span>{setupLoading ? 'Setting up...' : 'Begin Setup'}</span>
            </button>
          </motion.div>
        )}

        {/* Verification Step */}
        {step === 'verify' && twoFactorAuth && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 rounded-2xl p-6 border border-gray-800"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Verify Setup</h3>
              <p className="text-gray-400">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            {/* QR Code Placeholder */}
            <div className="bg-white rounded-lg p-4 mb-6 max-w-xs mx-auto">
              <div className="w-48 h-48 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-gray-500">QR Code</span>
              </div>
            </div>

            {/* Secret Key */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Secret Key</label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-800 rounded-lg p-3 font-mono text-sm">
                  {showSecret ? twoFactorAuth.secret_key : '••••••••••••••••••••••••••••••'}
                </div>
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => copyToClipboard(twoFactorAuth.secret_key)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Verification Code Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Verification Code</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={verifyAndEnable}
              disabled={setupLoading || verificationCode.length !== 6}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {setupLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              <span>{setupLoading ? 'Verifying...' : 'Verify & Enable'}</span>
            </button>
          </motion.div>
        )}

        {/* Backup Codes Step */}
        {step === 'backup' && twoFactorAuth && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 rounded-2xl p-6 border border-gray-800"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Backup Codes</h3>
              <p className="text-gray-400">
                Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator app.
              </p>
            </div>

            {/* Backup Codes */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-3">
                {twoFactorAuth.backup_codes?.map((code, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 rounded-lg p-3 font-mono text-center text-sm"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 mb-6">
              <button
                onClick={downloadBackupCodes}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Download</span>
              </button>
              <button
                onClick={() => copyToClipboard(twoFactorAuth.backup_codes?.join('\n') || '')}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Copy className="w-5 h-5" />
                <span>Copy All</span>
              </button>
            </div>

            <button
              onClick={() => setStep('complete')}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Continue</span>
            </button>
          </motion.div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 rounded-2xl p-6 border border-gray-800"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Setup Complete!</h3>
              <p className="text-gray-400 mb-6">
                Your two-factor authentication is now active. Your account is protected with an extra layer of security.
              </p>
              <Link
                href="/settings"
                className="inline-flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Settings</span>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Disable 2FA */}
        {twoFactorAuth?.is_enabled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 rounded-2xl p-6 border border-gray-800"
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2">Disable Two-Factor Authentication</h3>
              <p className="text-gray-400">
                Warning: Disabling 2FA will remove this security layer from your account.
              </p>
            </div>

            <button
              onClick={disableTwoFactorAuth}
              disabled={setupLoading}
              className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {setupLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              <span>{setupLoading ? 'Disabling...' : 'Disable 2FA'}</span>
            </button>
          </motion.div>
        )}

        {/* Messages */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg"
          >
            <p className="text-green-400">{message}</p>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg"
          >
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
