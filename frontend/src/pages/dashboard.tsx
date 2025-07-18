// DashboardPage.tsx
// Top-level dashboard selector page that renders the appropriate dashboard based on user role.
// - Uses ProtectedRoute to ensure the user is authenticated with any valid role.
// - Chooses between Builder, Buyer, or Admin dashboard components.
// - Displays a loading state while authentication is in progress.

import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import BuilderDashboard from '@/components/dashboards/BuilderDashboard'
import BuyerDashboard from '@/components/dashboards/BuyerDashboard'
import AdminDashboard from '@/components/dashboards/AdminDashboard'

export default function DashboardPage() {
  // Retrieve current user from context
  const { user } = useAuth()

  // Show loading placeholder until user information is available
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Welcome
      </div>
    )
  }

  // Select the correct dashboard component based on user role
  let DashboardComponent = BuilderDashboard
  if (user.role === 'admin') {
    DashboardComponent = AdminDashboard
  } else if (user.role === 'buyer') {
    DashboardComponent = BuyerDashboard
  }

  return (
    // ProtectedRoute allows any authenticated role to view
    <ProtectedRoute roles={['admin','builder','buyer']}>
      {/* Render the selected dashboard */}
      <DashboardComponent />
    </ProtectedRoute>
  )
}