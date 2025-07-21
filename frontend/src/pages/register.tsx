// RegisterPage.tsx
// Page component for user registration across roles: builder, admin, and buyer.
// - Shows shared fields (name, email, password) and buyer-specific fields when role is 'buyer'.
// - Calls appropriate backend endpoints: '/auth/register' for builder/admin, '/buyer/auth/register' for buyer.
// - Handles form state, validation, loading, and error display.

import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { register } from 'module'

// Define possible user roles
type Role = 'builder' | 'admin' | 'buyer'

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>('builder')   // Selected role
  const { register, register_buyer } = useAuth()

  // Shared form fields
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState<string|null>(null)

  // Buyer-specific fields
  const [emirates_id, setEmiratesId]   = useState('')
  const [phone_number, setPhoneNumber] = useState('')

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (role === 'buyer')
        register_buyer(name, emirates_id, phone_number, email, password, role)
      else
        register(name, email, password, role)
      // On success, navigate to the dashboard
      router.push('/dashboard')
    } catch (err: any) {
      // Display API error or fallback
      setError(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="p-8 rounded shadow-md w-1/2 flex flex-col gap-4"
      >
        <h2 className="text-xl font-semibold text-center">Create Account</h2>
        {/* Display any submission error */}
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {/* Select role dropdown */}
        <div>
          <label className="block text-sm font-medium">Role</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value as Role)}
            className="mt-1 block w-full border rounded p-2"
          >
            <option value="builder">Builder</option>
            <option value="admin">Bank Admin</option>
            <option value="buyer">Buyer</option>
          </select>
        </div>

        {/* Full name or name field */}
        <div>
          <input
            type="text"
            value={name}
            placeholder='Name'
            onChange={e => setName(e.target.value)}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        {/* Buyer-specific fields appear when role === 'buyer' */}
        {role === 'buyer' && (
          <>
            <div>
              <input
                type="text"
                value={emirates_id}
                placeholder='Emirates ID'
                onChange={e => setEmiratesId(e.target.value)}
                required
                className="mt-1 block w-full border rounded p-2"
              />
            </div>
            <div>
              <input
                type="text"
                value={phone_number}
                placeholder='Phone Number'
                onChange={e => setPhoneNumber(e.target.value)}
                required
                className="mt-1 block w-full border rounded p-2"
              />
            </div>
          </>
        )}

        {/* Email input */}
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

        {/* Password input */}
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
          className="w-full bg-primary-subtle text-dark py-2 rounded hover:bg-primary-emphasis"
        >
          Create Account
        </button>

        {/* Link to login page if already have an account */}
        <p className="text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="hover:underline">
            Sign in here
          </Link>
        </p>
      </form>
    </div>
  )
}