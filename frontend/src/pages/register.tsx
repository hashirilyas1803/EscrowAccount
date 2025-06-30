// src/pages/register.tsx
import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import api from '@/lib/api'

type Role = 'builder' | 'admin' | 'buyer'

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>('builder')

  // Shared fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string|null>(null)

  // Buyer-only fields
  const [emirates_id, setEmiratesId] = useState('')
  const [phone_number, setPhoneNumber] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (role === 'buyer') {
        await api.post('/buyer/auth/register', {
          name,
          emirates_id,
          phone_number,
          email,
          password,
        })
      } else {
        // builder or admin
        await api.post('/auth/register', {
          name,
          email,
          password,
          role,
        })
      }
      router.push('/login')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-semibold text-center">Create Account</h2>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

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

        <div>
          <label className="block text-sm font-medium">
            {role === 'buyer' ? 'Full Name' : 'Name'}
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        {role === 'buyer' && (
          <>
            <div>
              <label className="block text-sm font-medium">Emirates ID</label>
              <input
                type="text"
                value={emirates_id}
                onChange={e => setEmiratesId(e.target.value)}
                required
                className="mt-1 block w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone Number</label>
              <input
                type="text"
                value={phone_number}
                onChange={e => setPhoneNumber(e.target.value)}
                required
                className="mt-1 block w-full border rounded p-2"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
        >
          Create Account
        </button>

        <p className="text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 hover:underline">
            Sign in here
          </Link>
        </p>
      </form>
    </div>
  )
}