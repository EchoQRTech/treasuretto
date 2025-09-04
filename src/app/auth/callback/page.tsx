import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AuthCallbackPage() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  // Check if this is a password reset (user has no password set)
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session?.user?.user_metadata?.action === 'recovery') {
    // This is a password reset - redirect to password reset page
    redirect('/reset-password')
  }

  // If user is confirmed, redirect to dashboard
  if (user.email_confirmed_at) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email Confirmation Required
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please check your email and click the confirmation link to continue.
          </p>
        </div>
      </div>
    </div>
  )
}

