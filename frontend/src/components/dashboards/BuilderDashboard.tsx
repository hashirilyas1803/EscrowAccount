// BuilderDashboard.tsx
// React component for the builder dashboard, providing an overview of their projects, bookings, and transactions.
// - Protects route to users with 'builder' role.
// - Fetches dashboard metrics, project list, bookings, and transactions on mount.
// - Allows manual matching of unmatched transactions to bookings.

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// Interface for dashboard statistics
interface Stats {
  total_projects: number
  total_units: number
  units_booked: number
  total_booking_amount: number
  unmatched_transactions: number
}

// Interface for projects
interface Project { id: number; name: string; location: string }

// Interface for bookings visible to the builder
interface Booking {
  id: number
  unit_code: string      // public unit_id from the Unit table
  buyer_name: string
  amount: number
  date: string
}

// Interface for transactions (matched and unmatched)
interface Transaction {
  id: number
  amount: number
  booking_id: number | null
}

export default function BuilderDashboard() {
  // Retrieve authenticated user from context
  const { user } = useAuth()

  // Local state for dashboard data
  const [stats,    setStats]    = useState<Stats|null>(null)
  const [projects,setProjects] = useState<Project[]>([])
  const [bookings,setBookings] = useState<Booking[]>([])
  const [txs,     setTxs]      = useState<Transaction[]>([])
  // Track selected booking IDs for each unmatched transaction
  const [matchInputs, setMatchInputs] = useState<Record<number, number>>({})

  // Function to load all builder-related data in parallel
  const loadAll = () => {
    api.get('/builder/dashboard')
      .then(r => r.data.status === 'success' && setStats(r.data))
      .catch(console.error)

    api.get('/builder/projects')
      .then(r => r.data.status === 'success' && setProjects(r.data.projects))
      .catch(console.error)

    api.get('/builder/bookings')
      .then(r => r.data.status === 'success' && setBookings(r.data.bookings))
      .catch(console.error)

    api.get('/builder/transactions')
      .then(r => r.data.status === 'success' && setTxs(r.data.transactions))
      .catch(console.error)
  }

  // On mount or when user context becomes available, fetch data
  useEffect(() => {
    if (user) {
      loadAll()
    }
  }, [user])

  // Separate unmatched and matched transactions for UI sections
  const unmatched = txs.filter(t => t.booking_id === null)
  const matched   = txs.filter(t => t.booking_id !== null)

  // Determine which bookings are still available to match
  const matchedBookingIds = new Set(matched.map(t => t.booking_id!))
  const availableBookings = bookings.filter(b => !matchedBookingIds.has(b.id))

  // Handle matching a selected transaction to a chosen booking
  const handleMatch = async (txId: number) => {
    const bookingId = matchInputs[txId]
    if (!bookingId) {
      return alert('Select a booking first')
    }

    try {
      await api.post('/builder/transactions/match', {
        transaction_id: txId,
        booking_id: bookingId,
      })
      // Refresh all data after matching
      loadAll()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Match failed')
    }
  }

  return (
    // Restrict access to users with builder role
    <ProtectedRoute roles={['builder']}>
      <div className="space-y-8 p-6">

        {/* Page title */}
        <h1 className="text-3xl font-bold">Builder Dashboard</h1>

        {/* Metrics cards section */}
        {stats && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card label="Total Projects"       value={stats.total_projects}/>
            <Card label="Total Units"          value={stats.total_units}/>
            <Card label="Booked Units"         value={stats.units_booked}/>
            <Card label="Total Booking Amount" value={`$${stats.total_booking_amount}`}/>
            <Card label="Unmatched Txns"       value={stats.unmatched_transactions}/>
          </div>
        )}

        {/* Projects list with link to add new */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Your Projects</h2>
            <Link
              href="/projects/new"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              + Add Project
            </Link>
          </div>
          {projects.length === 0 ? (
            <p>No projects yet.</p>
          ) : (
            <ul className="space-y-2">
              {projects.map(p => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    className="block p-4 bg-white rounded shadow hover:bg-gray-50"
                  >
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-gray-500">{p.location}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Unmatched transactions with dropdown to select a booking */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Unmatched Transactions</h2>
          {unmatched.length === 0 ? (
            <p>All transactions are matched.</p>
          ) : unmatched.map(tx => (
            <div
              key={tx.id}
              className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 p-4 bg-yellow-50 rounded"
            >
              <div>ID: {tx.id} — ${tx.amount}</div>

              {/* Choose from available bookings to match */}
              <select
                className="border rounded p-1"
                onChange={e => setMatchInputs({
                  ...matchInputs,
                  [tx.id]: Number(e.target.value)
                })}
              >
                <option value="">— choose booking —</option>
                {availableBookings.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.id}: {b.unit_code} — ${b.amount} by {b.buyer_name}
                  </option>
                ))}
              </select>

              {/* Button to trigger match action */}
              <button
                onClick={() => handleMatch(tx.id)}
                className="mt-2 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Match
              </button>
            </div>
          ))}
        </section>

        {/* List of matched transactions */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Matched Transactions</h2>
          {matched.length === 0 ? (
            <p>No matched transactions yet.</p>
          ) : (
            <ul className="space-y-2">
              {matched.map(tx => (
                <li key={tx.id} className="p-4 bg-green-50 rounded shadow">
                  <div>ID: {tx.id}</div>
                  <div>Amount: ${tx.amount}</div>
                  <div>Booking ID: {tx.booking_id}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </ProtectedRoute>
  )
}

// Reusable Card component for displaying key-value metrics
function Card({ label, value }: { label: string; value: string|number }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}