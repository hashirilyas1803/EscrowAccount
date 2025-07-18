// BuyerDashboard.tsx
// React component for the buyer dashboard, enabling buyers to browse projects, view bookings, and record transactions.
// - Protects route to users with 'buyer' role.
// - Fetches available projects, buyer's bookings, and transaction history on mount.
// - Allows making new payments against units that are booked or available.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// Interface definitions for type safety
interface Project {
  id: number
  name: string
  location: string
}

interface Booking {
  id: number
  project_id: number
  project_name: string
  unit_id: number      // internal ID
  unit_number: string  // public-facing code
  amount: number
  date: string
}

interface Transaction {
  id: number
  unit_number: string
  unit_id: number      // internal unit ID
  booking_id: number
  amount: number
  date: string
}

interface UnitRow {
  id: number
  project_id: number
  unit_id: string
  floor: number
  area: number
  price: number
  booked: boolean
}

export default function BuyerDashboard() {
  // Get authenticated user info
  const { user } = useAuth()

  // State hooks for data lists
  const [projects, setProjects]         = useState<Project[]>([])
  const [allUnits, setAllUnits]         = useState<UnitRow[]>([])
  const [bookings, setBookings]         = useState<Booking[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])

  // Form state for recording a new transaction
  const [txUnit, setTxUnit]     = useState<string>('')
  const [txAmount, setTxAmount] = useState<string>('')
  const [txMethod, setTxMethod] = useState<'cash'|'bank transfer'>('bank transfer')
  const [txDate, setTxDate]     = useState<string>(new Date().toISOString().slice(0,16))
  const [txError, setTxError]   = useState<string|null>(null)
  const [txSuccess, setTxSuccess] = useState<string|null>(null)
  const [txLoading, setTxLoading] = useState<boolean>(false)

  // 1️⃣ Load initial data: projects, bookings, transactions
  useEffect(() => {
    api.get('/buyer/projects')
       .then(r => setProjects(r.data.projects))
       .catch(console.error)

    api.get('/buyer/bookings')
       .then(r => {
         setBookings(r.data.bookings)
         // Pre-select first booked unit for transactions
         if (r.data.bookings.length) {
           setTxUnit(r.data.bookings[0].unit_number)
         }
       })
       .catch(console.error)

    api.get('/buyer/transactions')
       .then(r => setTransactions(r.data.transactions))
       .catch(console.error)
  }, [user]) // re-run if user changes

  // 2️⃣ Once projects are loaded, fetch all units for each project
  useEffect(() => {
    if (!projects.length) return

    // Parallel requests for units of each project
    Promise.all(
      projects.map(p =>
        api.get<{ units: UnitRow[] }>(`/buyer/projects/${p.id}/units`)
           .then(r => r.data.units)
           .catch(() => [])
      )
    )
    .then(arrays => setAllUnits(arrays.flat()))
    .catch(console.error)
  }, [projects])

  // Compute lookup sets for filtering unit dropdown
  const bookedByYou = new Set(bookings.map(b => b.unit_id))
  const paidUnits   = new Set(transactions.map(t => t.unit_id))
  const matchedUnits = new Set(
    transactions
      .filter(t => t.booking_id !== null)
      .map(t => t.unit_id)
  )

  // Build options for transaction dropdown: available or your booked units not yet paid
  const eligibleUnits = allUnits
    .filter(u =>
      !u.booked ||
      (bookedByYou.has(u.id) && !paidUnits.has(u.id))
    )
    .map(u => ({
      value: u.unit_id,
      label: u.booked
        ? `${u.unit_id} — $${u.price} (Booked by you)`
        : `${u.unit_id} — $${u.price} (Available)`
    }))

  // Handler for submitting a new transaction
  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    setTxError(null)
    setTxSuccess(null)

    // Validate unit selection and amount
    if (!txUnit) {
      setTxError('Please select a unit')
      return
    }
    const amt = parseFloat(txAmount)
    if (isNaN(amt) || amt <= 0) {
      setTxError('Please enter a valid amount')
      return
    }

    setTxLoading(true)
    try {
      // Send transaction to API
      await api.post('/buyer/transactions', {
        unit_id: txUnit,
        amount: amt,
        date:   new Date(txDate).toISOString(),
        payment_method: txMethod,
      })
      setTxSuccess('Transaction recorded successfully!')

      // Refresh bookings & transactions
      const [bk, tx] = await Promise.all([
        api.get('/buyer/bookings'),
        api.get('/buyer/transactions'),
      ])
      setBookings(bk.data.bookings)
      setTransactions(tx.data.transactions)
      if (bk.data.bookings.length) {
        setTxUnit(bk.data.bookings[0].unit_number)
      }
      setTxAmount('')
    } catch (err: any) {
      setTxError(err.response?.data?.message || 'Failed to record transaction')
    } finally {
      setTxLoading(false)
    }
  }

  return (
    <ProtectedRoute roles={['buyer']}>
      <div className="space-y-12">

        {/* Projects section: browse all available projects */}
        <section>
          <h1 className="text-2xl font-bold mb-4">Browse Projects</h1>
          {projects.length === 0 ? (
            <p>No projects available.</p>
          ) : (
            <ul className="space-y-2">
              {projects.map(p => (
                <li key={p.id}>
                  <Link href={`/projects/${p.id}`} className="block p-4 rounded shadow">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm">{p.location}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Your Bookings section */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Your Bookings</h2>
          {bookings.length === 0 ? (
            <p>You have no bookings yet.</p>
          ) : (
            <ul className="space-y-4">
              {bookings.map(b => (
                <li key={b.id} className="p-4 rounded shadow">
                  <div><strong>Project:</strong> {b.project_name}</div>
                  <div><strong>Unit:</strong> {b.unit_number}</div>
                  <div><strong>Amount:</strong> ${b.amount}</div>
                  <div><strong>Date:</strong> {b.date}</div>
                  <div>
                    <strong>Status:</strong>{' '}
                    {matchedUnits.has(b.unit_id) ? 'Paid' : 'Unpaid'}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Make a Payment section */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Make a Payment</h2>
          <form onSubmit={handleTransaction} className="flex flex-col gap-4 w-1/2 p-6 rounded shadow">
            {/* Unit dropdown */}
            <div>
              <select
                value={txUnit}
                onChange={e => setTxUnit(e.target.value)}
                className="mt-1 block w-full border rounded p-2"
                required
              >
                <option value="">Select Unit</option>
                {eligibleUnits.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {/* Amount input */}
            <div>
              <input
                type="number"
                value={txAmount}
                placeholder='Amount'
                onChange={e => setTxAmount(e.target.value)}
                className="mt-1 block w-full border rounded p-2"
                min="0.01"
                step="0.01"
                required
              />
            </div>
            {/* Date/time picker */}
            <div>
              <input
                type="datetime-local"
                value={txDate}
                onChange={e => setTxDate(e.target.value)}
                className="mt-1 block w-full border rounded p-2"
                required
              />
            </div>
            {/* Payment method selector */}
            <div>
              <select
                value={txMethod}
                onChange={e => setTxMethod(e.target.value as any)}
                className="mt-1 block w-full border rounded p-2"
                required
              >
                <option value="">Select Payment Method</option>
                <option value="bank transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            {/* Display form-level messages */}
            {txError   && <p className="text-red-600 text-sm">{txError}</p>}
            {txSuccess && <p className="text-green-600 text-sm">{txSuccess}</p>}

            {/* Submit button */}
            <button
              type="submit"
              disabled={txLoading}
              className="px-4 py-2 rounded disabled:opacity-50 btn btn-secondary"
            >
              {txLoading ? 'Recording…' : 'Record Transaction'}
            </button>
          </form>
        </section>

      </div>
    </ProtectedRoute>
  )
}