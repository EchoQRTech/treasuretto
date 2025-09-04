'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { 
  Crown, 
  TrendingUp, 
  Zap, 
  Shield, 
  ShoppingBag, 
  Users, 
  BarChart3, 
  FileText, 
  Bot, 
  Star,
  Bell,
  Settings
} from 'lucide-react'

interface Tool {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href: string
  color: string
  gradient: string
}

const tools: Tool[] = [
  {
    id: 'depop',
    title: 'Depop Tools',
    description: 'Title Genius, Pricing Predictor, and best-selling trends.',
    icon: <TrendingUp className="w-6 h-6" />,
    href: '/vault/depop',
    color: 'from-pink-500 to-rose-500',
    gradient: 'bg-gradient-to-br from-pink-500 to-rose-500'
  },
  {
    id: 'poshmark',
    title: 'Poshmark Tools',
    description: 'Crosslist helpers, closet growth hacks, and pricing scripts.',
    icon: <ShoppingBag className="w-6 h-6" />,
    href: '/vault/poshmark',
    color: 'from-purple-500 to-indigo-500',
    gradient: 'bg-gradient-to-br from-purple-500 to-indigo-500'
  },
  {
    id: 'ebay',
    title: 'eBay Tools',
    description: 'Bulk listing templates, SEO boosters, and sourcing trackers.',
    icon: <BarChart3 className="w-6 h-6" />,
    href: '/vault/ebay',
    color: 'from-blue-500 to-cyan-500',
    gradient: 'bg-gradient-to-br from-blue-500 to-cyan-500'
  },
  {
    id: 'grailed',
    title: 'Grailed Tools',
    description: 'Menswear pricing index, hype alerts, and authenticity guides.',
    icon: <Shield className="w-6 h-6" />,
    href: '/vault/grailed',
    color: 'from-emerald-500 to-teal-500',
    gradient: 'bg-gradient-to-br from-emerald-500 to-teal-500'
  },
  {
    id: 'mercari',
    title: 'Mercari Tools',
    description: 'Quick-list templates and shipping hacks.',
    icon: <Zap className="w-6 h-6" />,
    href: '/vault/mercari',
    color: 'from-orange-500 to-red-500',
    gradient: 'bg-gradient-to-br from-orange-500 to-red-500'
  },
  {
    id: 'whatnot',
    title: 'Whatnot Tools',
    description: 'Auction scripts, live show prep checklists, and fees calculator.',
    icon: <Users className="w-6 h-6" />,
    href: '/vault/whatnot',
    color: 'from-yellow-500 to-amber-500',
    gradient: 'bg-gradient-to-br from-yellow-500 to-amber-500'
  },
  {
    id: 'vinted',
    title: 'Vinted Tools',
    description: 'Crosslisting automations and EU market pricing sheet.',
    icon: <TrendingUp className="w-6 h-6" />,
    href: '/vault/vinted',
    color: 'from-green-500 to-emerald-500',
    gradient: 'bg-gradient-to-br from-green-500 to-emerald-500'
  },
  {
    id: 'etsy',
    title: 'Etsy Tools',
    description: 'Vintage SEO keywords and product photography guide.',
    icon: <FileText className="w-6 h-6" />,
    href: '/vault/etsy',
    color: 'from-indigo-500 to-purple-500',
    gradient: 'bg-gradient-to-br from-indigo-500 to-purple-500'
  },
  {
    id: 'spreadsheets',
    title: 'Spreadsheets Library',
    description: '50+ pre-made tools: profit calculators, sourcing matrix, inventory tracker.',
    icon: <FileText className="w-6 h-6" />,
    href: '/vault/spreadsheets',
    color: 'from-cyan-500 to-blue-500',
    gradient: 'bg-gradient-to-br from-cyan-500 to-blue-500'
  },
  {
    id: 'ai',
    title: 'AI Tools Hub',
    description: 'Title Genius, Price Predictor, Negotiation Script Generator.',
    icon: <Bot className="w-6 h-6" />,
    href: '/vault/ai',
    color: 'from-violet-500 to-purple-500',
    gradient: 'bg-gradient-to-br from-violet-500 to-purple-500'
  }
]

interface Subscription {
  id: string
  user_id: string | null
  variant_id: string | null
  status: string | null
  started_at: string | null
  current_period_end: string | null
}

const pinnedTools = ['depop', 'poshmark', 'ai']

export default function VaultDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        
        // Get subscription data
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        setSubscription(subData)
      }
      setLoading(false)
    }
    
    getUser()
  }, [supabase])

  const getFirstName = (email: string | undefined) => {
    if (!email) return 'User'
    return email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const
      }
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
          <p className="text-gray-400">Please sign in to access the Vault.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                The Vault
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Subscription</p>
                <p className="text-sm font-medium text-emerald-400">
                  {subscription?.status === 'active' ? 'Active' : 'Trial'}
                </p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">{user.email?.charAt(0).toUpperCase()}</span>
              </div>
              <Link href="/settings" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="relative inline-block">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Welcome back, {getFirstName(user.email)} 👋
            </h1>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 blur-3xl opacity-20 -z-10"></div>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Your secret arsenal of reselling tools awaits. Unlock the power of the Vault.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Pinned Tools */}
            <motion.div 
              className="mb-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Star className="w-6 h-6 text-yellow-400 mr-2" />
                Pinned Tools
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools
                  .filter(tool => pinnedTools.includes(tool.id))
                  .map((tool) => (
                    <motion.div
                      key={tool.id}
                      variants={itemVariants}
                      whileHover={{ 
                        scale: 1.02,
                        transition: { duration: 0.2 }
                      }}
                      className="group"
                    >
                      <Link href={tool.href}>
                        <div className={`relative overflow-hidden rounded-2xl p-6 bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-emerald-500/20`}>
                          <div className={`w-12 h-12 ${tool.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                            {tool.icon}
                          </div>
                          <h3 className="text-xl font-bold mb-2 group-hover:text-emerald-400 transition-colors">
                            {tool.title}
                          </h3>
                          <p className="text-gray-400 text-sm mb-4">
                            {tool.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-400 text-sm font-medium">Open</span>
                            <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center group-hover:bg-emerald-500/40 transition-colors">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
              </div>
            </motion.div>

            {/* All Tools */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <h2 className="text-2xl font-bold mb-6">All Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => (
                  <motion.div
                    key={tool.id}
                    variants={itemVariants}
                    whileHover={{ 
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    }}
                    className="group"
                  >
                    <Link href={tool.href}>
                      <div className={`relative overflow-hidden rounded-2xl p-6 bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-emerald-500/20`}>
                        <div className={`w-12 h-12 ${tool.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                          {tool.icon}
                        </div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-emerald-400 transition-colors">
                          {tool.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-4">
                          {tool.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-400 text-sm font-medium">Open</span>
                          <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center group-hover:bg-emerald-500/40 transition-colors">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Recent Updates */}
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <Bell className="w-5 h-5 text-yellow-400 mr-2" />
                  Recent Updates
                </h3>
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <p className="text-sm font-medium text-emerald-400">New AI Tools</p>
                    <p className="text-xs text-gray-400">Title Genius v2.0 released</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-sm font-medium text-blue-400">Trend Alert</p>
                    <p className="text-xs text-gray-400">Vintage denim prices up 15%</p>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <p className="text-sm font-medium text-purple-400">New Tool</p>
                    <p className="text-xs text-gray-400">Crosslisting automation beta</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="text-lg font-bold mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tools Used</span>
                    <span className="text-emerald-400 font-medium">24</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Time Saved</span>
                    <span className="text-emerald-400 font-medium">12.5h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Revenue Boost</span>
                    <span className="text-emerald-400 font-medium">+23%</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link href="/trial" className="w-full p-3 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-lg border border-yellow-500/20 text-yellow-400 text-sm font-medium transition-colors block text-center">
                    Manage Trial
                  </Link>
                  <button className="w-full p-3 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20 text-emerald-400 text-sm font-medium transition-colors">
                    Generate Title
                  </button>
                  <button className="w-full p-3 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg border border-blue-500/20 text-blue-400 text-sm font-medium transition-colors">
                    Price Check
                  </button>
                  <button className="w-full p-3 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg border border-purple-500/20 text-purple-400 text-sm font-medium transition-colors">
                    Crosslist Item
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
