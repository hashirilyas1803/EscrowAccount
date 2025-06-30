// ProtectedRoute.tsx
// Higher-order component to guard pages based on authentication and role authorization.
// - Redirects unauthenticated users to the login page.
// - Redirects unauthorized roles to an 'unauthorized' page.
// - Renders children only if user is present and has an allowed role.

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  roles: string[]  // Array of roles allowed to view the content
}

export default function ProtectedRoute({
  children,
  roles,
}: ProtectedRouteProps) {
  // Get current user and Next.js router
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If no user, redirect to login
    if (user === null) {
      router.replace('/login')
    }
    // If user role not in allowed list, redirect to unauthorized page
    else if (!roles.includes(user.role)) {
      router.replace('/unauthorized')
    }
  }, [user, router, roles])

  // While redirecting (or if user/role check fails), render nothing
  if (!user || !roles.includes(user.role)) {
    return null
  }

  // Authorized: render children components
  return <>{children}</>
}