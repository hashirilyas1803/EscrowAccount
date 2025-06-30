// HomePage.tsx
// Root entry point for the application.
// - Redirects authenticated users to their dashboard based on role.
// - Redirects unauthenticated visitors to the login page.
// - Shows a loading state while determining authentication.

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'

export default function HomePage() {
  // Access current authentication state
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Once user state is known, redirect accordingly
    if (user) {
      // Authenticated: go to dashboard
      router.replace('/dashboard')
    } else {
      // Not authenticated: go to login
      router.replace('/login')
    }
  }, [user, router])

  // While redirecting, display a simple loading message
  return <div className="text-center p-10">Loading…</div>
}