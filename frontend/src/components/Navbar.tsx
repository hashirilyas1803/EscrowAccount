// Navbar.tsx
// Site-wide navigation bar component that displays branding and login/logout controls based on authentication state.

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function Navbar() {
  // Retrieve current user and logout function from auth context
  const { user, logout } = useAuth()

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
        {/* Site logo/name linking back to home */}
        <Link href="/" className="text-2xl font-bold">
          EscrowBank
        </Link>

        <div className="space-x-4">
          {user ? (
            // If user is authenticated, show role and logout button
            <>
              <span className="capitalize">{user.role}</span>
              <button
                onClick={logout}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                Logout
              </button>
            </>
          ) : (
            // If no user, show link to login page
            <Link href="/login" className="px-3 py-1 hover:underline">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}