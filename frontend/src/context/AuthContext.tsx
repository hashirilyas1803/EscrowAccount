// AuthContext.tsx
// React context for authentication state and actions (login, logout) across the app.
// - Manages current user info (id, name, role).
// - Provides login/logout functions with role-based endpoints.

import React, { createContext, useContext, ReactNode, useState } from 'react'
import api from '@/lib/api'

// Define possible user roles
type Role = 'builder' | 'buyer' | 'admin'

// User object stored in context
export interface User {
  id: number
  name: string
  role: Role
}

// Shape of the authentication context
interface AuthContextType {
  user: User | null            // Currently logged-in user, or null if none
  login: (                  
    email: string,
    password: string,
    role: Role
  ) => Promise<void>            // Function to authenticate and set user
  logout: () => Promise<void>  // Function to clear session and user
}

// Create the context with an initial placeholder
const AuthContext = createContext<AuthContextType>({} as any)

// Provider component wrapping the app, supplying auth functions and state
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Local state for the authenticated user
  const [user, setUser] = useState<User | null>(null)

  // Login function: selects endpoint based on role
  const login = async (email: string, password: string, role: Role) => {
    if (role === 'buyer') {
      // Buyer-specific login API
      const res = await api.post('/buyer/auth/login', { email, password })
      setUser({ id: res.data.buyer_id, name: res.data.name, role: 'buyer' })
    } else {
      // Builder or Admin login API
      const res = await api.post('/auth/login', { email, password, role })
      setUser({ id: res.data.user_id, name: res.data.name, role: res.data.role })
    }
  }

  // Logout function: calls appropriate endpoint and clears user state
  const logout = async () => {
    if (user?.role === 'buyer') {
      await api.post('/buyer/auth/logout')
    } else {
      await api.post('/auth/logout')
    }
    setUser(null)
  }

  // Provide user and auth actions to descendants
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook for easy context consumption
export const useAuth = () => useContext(AuthContext)