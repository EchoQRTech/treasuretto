'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download
} from 'lucide-react'

interface ApiKey {
  id: string
  user_id: string
  key_name: string
  key_hash: string
  permissions: string[]
  is_active: boolean
  last_used: string | null
  expires_at: string | null
  created_at: string
}

export default function ApiKeysPage() {
  const [user, setUser] = useState<User | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewKey, setShowNewKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([])
  const [newKeyExpiresDays, setNewKeyExpiresDays] = useState(365)
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  const availablePermissions = [
    'read:profile',
    'write:profile',
    'read:subscription',
    'write:subscription',
    'read:analytics',
    'write:analytics',
    'admin:users',
    'admin:system'
  ]

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        await loadApiKeys()
      }
      setLoading(false)
    }

    getUser()
  }, [supabase])

  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setApiKeys(data || [])
    } catch (error) {
      console.error('Failed to load API keys:', error)
      setError('Failed to load API keys')
    }
  }

  const generateApiKey = async () => {
    if (!newKeyName.trim()) {
      setError('Please enter a key name')
      return
    }

    if (newKeyPermissions.length === 0) {
      setError('Please select at least one permission')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.rpc('generate_api_key', {
        p_user_id: user!.id,
        p_key_name: newKeyName,
        p_permissions: newKeyPermissions,
        p_expires_days: newKeyExpiresDays
      })

      if (error) throw error

      setGeneratedKey(data)
      setShowNewKey(false)
      setNewKeyName('')
      setNewKeyPermissions([])
      setNewKeyExpiresDays(365)
      setMessage('API key generated successfully! Make sure to copy it now as it won\'t be shown again.')
      
      await loadApiKeys()
    } catch (error) {
      console.error('Failed to generate API key:', error)
      setError('Failed to generate API key')
    } finally {
      setLoading(false)
    }
  }

  const revokeApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', keyId)
        .eq('user_id', user!.id)

      if (error) throw error

      setMessage('API key revoked successfully')
      await loadApiKeys()
    } catch (error) {
      console.error('Failed to revoke API key:', error)
      setError('Failed to revoke API key')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMessage('Copied to clipboard!')
    setTimeout(() => setMessage(null), 2000)
  }

  const downloadApiKeys = () => {
    const keysData = apiKeys.map(key => ({
      name: key.key_name,
      permissions: key.permissions.join(', '),
      created: key.created_at,
      expires: key.expires_at,
      last_used: key.last_used,
      status: key.is_active ? 'Active' : 'Revoked'
    }))

    const csv = [
      'Name,Permissions,Created,Expires,Last Used,Status',
      ...keysData.map(key => 
        `"${key.name}","${key.permissions}","${key.created}","${key.expires || 'Never'}","${key.last_used || 'Never'}","${key.status}"`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'api-keys.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (loading && !user) {
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
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                <Key className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-bold">API Keys</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={downloadApiKeys}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              
              <button
                onClick={() => setShowNewKey(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New API Key</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Generated Key Display */}
        {generatedKey && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-green-500/10 border border-green-500/30 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-400">New API Key Generated</h3>
              <button
                onClick={() => setGeneratedKey(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono text-green-400 break-all">
                  {generatedKey}
                </code>
                <button
                  onClick={() => copyToClipboard(generatedKey)}
                  className="ml-4 p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="text-sm text-gray-400">
              <p className="mb-2">⚠️ Important: Copy this key now. It won&apos;t be shown again for security reasons.</p>
              <p>Use this key in the Authorization header: <code className="bg-gray-800 px-2 py-1 rounded">Authorization: Bearer {generatedKey}</code></p>
            </div>
          </motion.div>
        )}

        {/* New API Key Form */}
        {showNewKey && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-gray-900 rounded-2xl p-6 border border-gray-800"
          >
            <h3 className="text-xl font-bold mb-6">Generate New API Key</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Key Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production API Key"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Permissions</label>
                <div className="grid grid-cols-2 gap-3">
                  {availablePermissions.map((permission) => (
                    <label key={permission} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newKeyPermissions.includes(permission)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewKeyPermissions([...newKeyPermissions, permission])
                          } else {
                            setNewKeyPermissions(newKeyPermissions.filter(p => p !== permission))
                          }
                        }}
                        className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Expires In (Days)</label>
                <input
                  type="number"
                  value={newKeyExpiresDays}
                  onChange={(e) => setNewKeyExpiresDays(parseInt(e.target.value))}
                  min="1"
                  max="3650"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={generateApiKey}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Key className="w-5 h-5" />
                  )}
                  <span>{loading ? 'Generating...' : 'Generate Key'}</span>
                </button>
                
                <button
                  onClick={() => setShowNewKey(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* API Keys List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900 rounded-2xl p-6 border border-gray-800"
        >
          <h3 className="text-xl font-bold mb-6">Your API Keys</h3>
          
          {apiKeys.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold mb-2">No API Keys</h4>
              <p className="text-gray-400 mb-6">Create your first API key to start integrating with our API.</p>
              <button
                onClick={() => setShowNewKey(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>Create API Key</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className={`p-4 rounded-lg border ${
                    key.is_active 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-gray-800/50 border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold">{key.key_name}</h4>
                        <div className="flex items-center space-x-2">
                          {key.is_active ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                              Revoked
                            </span>
                          )}
                          
                          {isExpired(key.expires_at) && (
                            <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                              Expired
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
                        <div>
                          <span className="font-medium">Permissions:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {key.permissions.map((permission) => (
                              <span
                                key={permission}
                                className="px-2 py-1 bg-gray-700 rounded text-xs"
                              >
                                {permission}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <span className="font-medium">Created:</span>
                          <p>{formatDate(key.created_at)}</p>
                        </div>
                        
                        <div>
                          <span className="font-medium">Last Used:</span>
                          <p>{formatDate(key.last_used)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {key.is_active && (
                        <button
                          onClick={() => revokeApiKey(key.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Revoke Key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

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
