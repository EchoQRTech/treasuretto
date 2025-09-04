import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Navigation */}
        <nav className="relative z-10 flex justify-between items-center px-6 py-6 lg:px-12">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🔒</span>
            </div>
            <span className="text-white font-bold text-xl">TreasureTto</span>
          </div>
          <div className="hidden md:flex space-x-8">
            <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
          <Link 
            href="/signup"
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-2 rounded-lg font-semibold hover:from-yellow-300 hover:to-orange-400 transition-all duration-200 transform hover:scale-105"
          >
            Get Started
          </Link>
        </nav>

        {/* Main Hero Content */}
        <div className="relative z-10 text-center px-6 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto">
            {/* Animated Lock Icon */}
            <div className="mb-8">
              <div className="inline-block animate-bounce">
                <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
                  <span className="text-4xl">🔓</span>
                </div>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Unlock
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                The Vault
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl lg:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              The ultimate toolkit for vintage and streetwear resellers. Get battle-tested playbooks, 
              exclusive sourcing strategies, and AI-powered tools to scale your business.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link 
                href="/signup"
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-8 py-4 rounded-lg font-bold text-lg hover:from-yellow-300 hover:to-orange-400 transition-all duration-200 transform hover:scale-105 shadow-xl"
              >
                Start 7-Day Trial - $1
              </Link>
              <Link 
                href="/pricing"
                className="border-2 border-gray-400 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-black transition-all duration-200"
              >
                View All Plans
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span>7-Day Money Back Guarantee</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span>Cancel Anytime</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span>Instant Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 px-6 py-20 lg:py-32">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold text-white text-center mb-16">
            What&apos;s Inside The Vault?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 hover:border-yellow-400 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Shipping Cheat Sheet</h3>
              <p className="text-gray-300">Save thousands yearly with optimized carrier rates & packaging hacks that most resellers never discover.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 hover:border-yellow-400 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">📸</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Photography Vault</h3>
              <p className="text-gray-300">Pro-level photo setups that make your listings 3× more clickable and drive higher conversion rates.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 hover:border-yellow-400 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Fake Check Center</h3>
              <p className="text-gray-300">Spot fakes before you buy (or sell) with our comprehensive reference database and verification tools.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 hover:border-yellow-400 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Trends & Drops</h3>
              <p className="text-gray-300">Weekly insights on what&apos;s hot before the market catches on. Stay ahead of the competition.</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 hover:border-yellow-400 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">📂</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Listing Templates</h3>
              <p className="text-gray-300">Plug-and-play copy for Depop, Grailed, eBay, and more. Save hours on every listing.</p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 hover:border-yellow-400 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Pricing Psychology</h3>
              <p className="text-gray-300">Maximize profit without scaring off buyers. Master the art of pricing psychology.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="relative z-10 px-6 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8">
            Start Your Journey Today
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            Join thousands of successful resellers who&apos;ve unlocked The Vault
          </p>
          
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-1 rounded-2xl max-w-md mx-auto">
            <div className="bg-gray-900 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">The Vault Subscription</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$1</span>
                <span className="text-gray-300 text-lg"> for 7 days</span>
              </div>
              <div className="mb-6">
                <span className="text-2xl font-bold text-white">$25</span>
                <span className="text-gray-300">/month after</span>
              </div>
              <Link 
                href="/auth"
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black py-4 rounded-lg font-bold text-lg hover:from-yellow-300 hover:to-orange-400 transition-all duration-200 transform hover:scale-105 block"
              >
                Unlock The Vault Now
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 px-6 py-12">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🔒</span>
            </div>
            <span className="text-white font-bold text-xl">TreasureTto</span>
          </div>
          <p className="text-gray-400 mb-6">
            The ultimate toolkit for vintage and streetwear resellers
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/auth" className="hover:text-white transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
