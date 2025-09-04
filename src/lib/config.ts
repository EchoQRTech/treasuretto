// Configuration constants
export const config = {
  // Lemon Squeezy Configuration
  lemonSqueezy: {
    storeUrl: 'https://treasurettovaultt.lemonsqueezy.com',
    variantId: '944570',
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success`
  },
  
  // App Configuration
  app: {
    name: 'TreasureTto',
    description: 'The ultimate toolkit for vintage and streetwear resellers',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }
}

// Helper function to generate checkout URL
export function generateCheckoutUrl(userId: string): string {
  const { lemonSqueezy } = config
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  return `${lemonSqueezy.storeUrl}/buy/${lemonSqueezy.variantId}?checkout[success_url]=${encodeURIComponent(`${baseUrl}/checkout/success`)}&custom[user_id]=${userId}`
}
