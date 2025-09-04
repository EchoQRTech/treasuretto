'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { 
  User as UserIcon, 
  Mail, 
  Key, 
  Trash2,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react'

export default function AccountManagementPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Form states
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  
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
        setNewEmail(user.email || '')
      } catch (error) {
        console.error('Account management error:', error)
        setError('Failed to load user data')
      } finally {
        setLoading(false)
      }
    }
    
    getUser()
  }, [supabase, router])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setError(null)
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      setUpdating(false)
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      setUpdating(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Password updated successfully')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err) {
      setError('Failed to update password')
    } finally {
      setUpdating(false)
    }
  }

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setError(null)
    setMessage(null)

    if (!user) {
      setError('User not found')
      setUpdating(false)
      return
    }

    if (!newEmail || newEmail === user.email) {
      setError('Please enter a different email address')
      setUpdating(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Email update initiated. Please check your new email for confirmation.')
      }
    } catch (err) {
      setError('Failed to update email')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteAccount = async () => {
    setUpdating(true)
    setError(null)
    setMessage(null)

    if (!user) {
      setError('User not found')
      setUpdating(false)
      setShowDeleteConfirm(false)
      return
    }

    try {
      // Delete user profile first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (profileError) {
        console.error('Profile deletion error:', profileError)
      }

      // Delete user account
      const { error } = await supabase.auth.admin.deleteUser(user.id)

      if (error) {
        setError('Failed to delete account. Please contact support.')
      } else {
        setMessage('Account deleted successfully')
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    } catch (err) {
      setError('Failed to delete account')
    } finally {
      setUpdating(false)
      setShowDeleteConfirm(false)
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
          <p className="text-gray-400">Please sign in to access account management.</p>
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
                onClick={() => router.push('/settings')}
                className="text-gray-400 hover:text-white transition-colors flex items-center"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Settings
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

        {/* Account Information */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 mb-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center mr-4">
              <UserIcon className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Account Management</h1>
              <p className="text-gray-400">Manage your account settings and preferences</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Last Sign In
              </label>
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                                 <span className="text-white">{formatDate(user.last_sign_in_at || null)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Key className="w-6 h-6 mr-2" />
            Change Password
          </h2>

          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm new password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={updating || !newPassword || !confirmPassword}
              className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {updating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <Key className="w-5 h-5 mr-2" />
                  Update Password
                </>
              )}
            </button>
          </form>
        </div>

        {/* Change Email */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Mail className="w-6 h-6 mr-2" />
            Change Email Address
          </h2>

          <form onSubmit={handleEmailChange} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                New Email Address
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter new email address"
                required
              />
            </div>

            <button
              type="submit"
              disabled={updating || !newEmail || newEmail === user.email}
              className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {updating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Updating Email...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 mr-2" />
                  Update Email
                </>
              )}
            </button>
          </form>
        </div>

        {/* Delete Account */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Trash2 className="w-6 h-6 mr-2 text-red-400" />
            Delete Account
          </h2>

          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-red-400 mr-3 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-2">
                  Warning: This action cannot be undone
                </h3>
                <p className="text-gray-300 mb-4">
                  Deleting your account will permanently remove all your data, including your profile, subscription information, and any saved preferences. This action cannot be reversed.
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          {showDeleteConfirm && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Confirm Account Deletion</h3>
              <p className="text-gray-300 mb-6">
                Are you absolutely sure you want to delete your account? This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={handleDeleteAccount}
                  disabled={updating}
                  className="flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5 mr-2" />
                      Yes, Delete My Account
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={updating}
                  className="flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
