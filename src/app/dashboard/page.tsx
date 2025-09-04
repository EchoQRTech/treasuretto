import { getServerUser } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const { user } = await getServerUser()
  
  if (!user) {
    redirect('/pricing')
  }

  // Redirect to the new Vault Dashboard
  redirect('/vault/dashboard')
}

