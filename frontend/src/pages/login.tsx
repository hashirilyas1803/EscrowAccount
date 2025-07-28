// LoginPage.tsx
// Page component for user authentication; allows selection of role and credentials.
// - Captures email, password, and role (builder, admin, or buyer).
// - Calls login from AuthContext and redirects to dashboard upon success.
// - Displays API error messages when login fails.

import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  // Form state for email, password, and role selection
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole]       = useState<'builder'|'buyer'|'admin'>('builder')
  const [error, setError]     = useState<string|null>(null)

  // Handle submission: perform login and navigate to dashboard
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password, role)
      router.push('/dashboard')
    } catch (err: any) {
      // Show error returned by API or fallback
      setError(err.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="p-8 rounded shadow-md w-1/2 flex flex-col gap-4"
      >
        <h2 className="text-xl font-semibold text-center">Sign In</h2>
        {/* Display login error if present */}
        {error && <p className="text-danger text-sm">{error}</p>}

        {/* Role selection dropdown */}
        <div>
          <select
            value={role}
            onChange={e => setRole(e.target.value as any)}
            className="mt-1 block w-full border rounded p-2"
          >
            <option value="builder">Builder</option>
            <option value="admin">Bank Admin</option>
            <option value="buyer">Buyer</option>
          </select>
        </div>

        {/* Email input field */}
        <div>
          <input
            type="email"
            value={email}
            placeholder='Email'
            onChange={e => setEmail(e.target.value)}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        {/* Password input field */}
        <div>
          <input
            type="password"
            value={password}
            placeholder='Password'
            onChange={e => setPassword(e.target.value)}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="w-full btn-custom py-2 rounded"
        >
          Login
        </button>

        {/* Link to registration page */}
        <p className="text-center text-sm mt-4">
          Don’t have an account?{' '}
          <Link href="/register" className="hover:underline">
            Register here
          </Link>
        </p>
      </form>
    </div>
  )
}