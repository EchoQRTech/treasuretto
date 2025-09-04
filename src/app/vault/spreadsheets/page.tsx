'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { 
  Crown, 
  ArrowLeft,
  Download,
  FileSpreadsheet,
  TrendingUp,
  Calculator,
  ShoppingCart,
  Package,
  DollarSign,
  BarChart3,
  Calendar,
  Target,
  Zap,
  Star,
  Clock,
  Users as UsersIcon,
  Settings,
  Plus,
  Search,
  Filter
} from 'lucide-react'

interface Spreadsheet {
  id: string
  title: string
  description: string
  category: string
  icon: React.ReactNode
  color: string
  gradient: string
  features: string[]
  downloadUrl: string
  isPremium: boolean
  isNew?: boolean
}

const spreadsheets: Spreadsheet[] = [
  {
    id: 'profit-calculator',
    title: 'Profit Calculator Pro',
    description: 'Advanced profit tracking with fees, shipping, and ROI calculations',
    category: 'Finance',
    icon: <Calculator className="w-6 h-6" />,
    color: 'from-green-500 to-emerald-500',
    gradient: 'bg-gradient-to-br from-green-500 to-emerald-500',
    features: ['Fee calculations', 'ROI tracking', 'Tax estimates', 'Multi-platform'],
    downloadUrl: '/api/spreadsheets/profit-calculator',
    isPremium: true,
    isNew: true
  },
  {
    id: 'inventory-tracker',
    title: 'Inventory Management',
    description: 'Complete inventory tracking with SKU management and stock alerts',
    category: 'Inventory',
    icon: <Package className="w-6 h-6" />,
    color: 'from-blue-500 to-cyan-500',
    gradient: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    features: ['SKU tracking', 'Stock alerts', 'Location management', 'Barcode support'],
    downloadUrl: '/api/spreadsheets/inventory-tracker',
    isPremium: true
  },
  {
    id: 'sourcing-matrix',
    title: 'Sourcing Matrix',
    description: 'Data-driven sourcing decisions with market analysis and profit potential',
    category: 'Sourcing',
    icon: <Target className="w-6 h-6" />,
    color: 'from-purple-500 to-indigo-500',
    gradient: 'bg-gradient-to-br from-purple-500 to-indigo-500',
    features: ['Market analysis', 'Profit potential', 'Trend tracking', 'Competition data'],
    downloadUrl: '/api/spreadsheets/sourcing-matrix',
    isPremium: true
  },
  {
    id: 'crosslisting-automation',
    title: 'Crosslisting Automation',
    description: 'Streamline crosslisting across multiple platforms with templates',
    category: 'Automation',
    icon: <Zap className="w-6 h-6" />,
    color: 'from-yellow-500 to-orange-500',
    gradient: 'bg-gradient-to-br from-yellow-500 to-orange-500',
    features: ['Multi-platform', 'Template system', 'Bulk operations', 'Auto-scheduling'],
    downloadUrl: '/api/spreadsheets/crosslisting-automation',
    isPremium: true
  },
  {
    id: 'sales-tracker',
    title: 'Sales Performance Tracker',
    description: 'Track sales metrics, conversion rates, and platform performance',
    category: 'Analytics',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'from-pink-500 to-rose-500',
    gradient: 'bg-gradient-to-br from-pink-500 to-rose-500',
    features: ['Sales metrics', 'Conversion tracking', 'Platform comparison', 'Trends'],
    downloadUrl: '/api/spreadsheets/sales-tracker',
    isPremium: false
  },
  {
    id: 'expense-tracker',
    title: 'Expense Tracker',
    description: 'Track all business expenses and categorize for tax purposes',
    category: 'Finance',
    icon: <DollarSign className="w-6 h-6" />,
    color: 'from-emerald-500 to-teal-500',
    gradient: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    features: ['Expense categorization', 'Tax preparation', 'Receipt tracking', 'Budget planning'],
    downloadUrl: '/api/spreadsheets/expense-tracker',
    isPremium: false
  },
  {
    id: 'shipping-calculator',
    title: 'Shipping Calculator',
    description: 'Calculate shipping costs across different carriers and services',
    category: 'Shipping',
    icon: <ShoppingCart className="w-6 h-6" />,
    color: 'from-indigo-500 to-purple-500',
    gradient: 'bg-gradient-to-br from-indigo-500 to-purple-500',
    features: ['Multi-carrier', 'Rate comparison', 'Zone calculations', 'Package optimization'],
    downloadUrl: '/api/spreadsheets/shipping-calculator',
    isPremium: false
  },
  {
    id: 'trend-tracker',
    title: 'Trend Tracker',
    description: 'Track market trends and seasonal patterns for better sourcing',
    category: 'Analytics',
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'from-red-500 to-pink-500',
    gradient: 'bg-gradient-to-br from-red-500 to-pink-500',
    features: ['Market trends', 'Seasonal patterns', 'Demand forecasting', 'Price tracking'],
    downloadUrl: '/api/spreadsheets/trend-tracker',
    isPremium: false
  },
  {
    id: 'customer-database',
    title: 'Customer Database',
    description: 'Manage customer information and track repeat buyers',
    category: 'CRM',
    icon: <UsersIcon className="w-6 h-6" />,
    color: 'from-cyan-500 to-blue-500',
    gradient: 'bg-gradient-to-br from-cyan-500 to-blue-500',
    features: ['Customer profiles', 'Purchase history', 'Communication log', 'Loyalty tracking'],
    downloadUrl: '/api/spreadsheets/customer-database',
    isPremium: false
  },
  {
    id: 'auction-tracker',
    title: 'Auction Tracker',
    description: 'Track auction performance and bidding strategies',
    category: 'Auctions',
    icon: <Clock className="w-6 h-6" />,
    color: 'from-amber-500 to-yellow-500',
    gradient: 'bg-gradient-to-br from-amber-500 to-yellow-500',
    features: ['Auction tracking', 'Bid history', 'Performance metrics', 'Strategy analysis'],
    downloadUrl: '/api/spreadsheets/auction-tracker',
    isPremium: false
  },
  {
    id: 'competitor-analysis',
    title: 'Competitor Analysis',
    description: 'Track competitor pricing and strategies',
    category: 'Analytics',
    icon: <Target className="w-6 h-6" />,
    color: 'from-violet-500 to-purple-500',
    gradient: 'bg-gradient-to-br from-violet-500 to-purple-500',
    features: ['Price tracking', 'Strategy analysis', 'Market positioning', 'Gap analysis'],
    downloadUrl: '/api/spreadsheets/competitor-analysis',
    isPremium: true
  },
  {
    id: 'tax-preparation',
    title: 'Tax Preparation Helper',
    description: 'Organize financial data for tax season',
    category: 'Finance',
    icon: <FileSpreadsheet className="w-6 h-6" />,
    color: 'from-gray-500 to-gray-600',
    gradient: 'bg-gradient-to-br from-gray-500 to-gray-600',
    features: ['Income tracking', 'Expense categorization', 'Tax deductions', 'Reporting'],
    downloadUrl: '/api/spreadsheets/tax-preparation',
    isPremium: false
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

const categories = ['All', 'Finance', 'Inventory', 'Sourcing', 'Automation', 'Analytics', 'Shipping', 'CRM', 'Auctions']

export default function SpreadsheetsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [downloading, setDownloading] = useState<string | null>(null)
  
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

  const handleDownload = async (spreadsheetId: string, isPremium: boolean) => {
    if (isPremium && subscription?.status !== 'active') {
      // Redirect to upgrade page
      window.location.href = '/trial'
      return
    }

    setDownloading(spreadsheetId)
    
    try {
      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real app, this would trigger an actual download
      console.log(`Downloading ${spreadsheetId}`)
      
      // For demo purposes, show success message
      alert('Spreadsheet downloaded successfully!')
    } catch (error) {
      console.error('Download error:', error)
      alert('Download failed. Please try again.')
    } finally {
      setDownloading(null)
    }
  }

  const filteredSpreadsheets = spreadsheets.filter(spreadsheet => {
    const matchesCategory = selectedCategory === 'All' || spreadsheet.category === selectedCategory
    const matchesSearch = spreadsheet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         spreadsheet.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

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
          <p className="text-gray-400">Please sign in to access the Spreadsheets Library.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/vault/dashboard" className="text-gray-400 hover:text-white transition-colors flex items-center">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
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
          <div className="relative inline-block mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileSpreadsheet className="w-8 h-8 text-black" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 blur-3xl opacity-20 -z-10"></div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Spreadsheets Library
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Access 50+ professional spreadsheets designed specifically for resellers. Track profits, manage inventory, analyze trends, and automate your workflow.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Spreadsheets</p>
                <p className="text-2xl font-bold text-white">{spreadsheets.length}</p>
              </div>
              <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Premium Tools</p>
                <p className="text-2xl font-bold text-white">{spreadsheets.filter(s => s.isPremium).length}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Categories</p>
                <p className="text-2xl font-bold text-white">{categories.length - 1}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Free Tools</p>
                <p className="text-2xl font-bold text-white">{spreadsheets.filter(s => !s.isPremium).length}</p>
              </div>
              <Download className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search spreadsheets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Spreadsheets Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredSpreadsheets.map((spreadsheet) => (
            <motion.div
              key={spreadsheet.id}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              className="group"
            >
              <div className="relative overflow-hidden rounded-2xl p-6 bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-emerald-500/20">
                {/* Premium Badge */}
                {spreadsheet.isPremium && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      PRO
                    </div>
                  </div>
                )}

                {/* New Badge */}
                {spreadsheet.isNew && (
                  <div className="absolute top-4 left-4">
                    <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                      NEW
                    </div>
                  </div>
                )}

                {/* Icon */}
                <div className={`w-12 h-12 ${spreadsheet.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {spreadsheet.icon}
                </div>

                {/* Content */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-emerald-400 transition-colors">
                    {spreadsheet.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">
                    {spreadsheet.description}
                  </p>
                  
                  {/* Features */}
                  <div className="space-y-1">
                    {spreadsheet.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center text-xs text-gray-500">
                        <div className="w-1 h-1 bg-emerald-400 rounded-full mr-2"></div>
                        {feature}
                      </div>
                    ))}
                    {spreadsheet.features.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{spreadsheet.features.length - 3} more features
                      </div>
                    )}
                  </div>
                </div>

                {/* Action */}
                <button
                  onClick={() => handleDownload(spreadsheet.id, spreadsheet.isPremium)}
                  disabled={downloading === spreadsheet.id}
                  className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                >
                  {downloading === spreadsheet.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      {spreadsheet.isPremium && subscription?.status !== 'active' ? 'Upgrade to Download' : 'Download'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredSpreadsheets.length === 0 && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <FileSpreadsheet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No spreadsheets found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </motion.div>
        )}

        {/* Upgrade CTA */}
        {subscription?.status !== 'active' && (
          <motion.div 
            className="mt-12 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Star className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Unlock Premium Spreadsheets</h2>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              Get access to advanced profit calculators, inventory management systems, and automation tools that will save you hours every week.
            </p>
            <Link 
              href="/trial"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold rounded-lg hover:from-yellow-300 hover:to-orange-400 transition-all duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              Upgrade to Pro
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}
