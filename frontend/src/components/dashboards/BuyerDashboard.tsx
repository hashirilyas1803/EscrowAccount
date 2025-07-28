// BuyerDashboard.tsx
// React component for the buyer dashboard, enabling buyers to browse projects, view bookings, and record transactions.
// - Protects route to users with 'buyer' role.
// - Fetches available projects, buyer's bookings, and transaction history on mount.
// - Allows making new payments against units that are booked or available.

import { useState, useEffect, useMemo } from 'react'
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
  unit_id: number
  buyer_id: number
  unit_number: string
  amount: number
  date: string
}

interface Transaction {
  id: number
  unit_id: number
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
  const [txUnit, setTxUnit] = useState<number | ''>('');
  const [txAmount, setTxAmount] = useState<string>('')
  const [txMethod, setTxMethod] = useState<'cash'|'bank transfer'>('bank transfer')
  const [txDate, setTxDate]     = useState<string>(new Date().toISOString().slice(0,16))
  const [txError, setTxError]   = useState<string|null>(null)
  const [txSuccess, setTxSuccess] = useState<string|null>(null)
  const [txLoading, setTxLoading] = useState<boolean>(false)

  const [bookingFilter, setBookingFilter] = useState<'all' | 'paid' | 'unpaid'>('all')

  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

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
  }, [user])

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
  const bookedByYou = useMemo(() => {
    return new Set(bookings.map(b => b.unit_id))
  }, [bookings])
  const paidUnits = useMemo(() => {
    return new Set(transactions.map(t => t.unit_id))
  }, [transactions])

  const matchedUnits = useMemo(() => {
    return new Set(
      transactions
        .filter(t => t.booking_id !== null)
        .map(t => t.unit_id)
    )
  }, [transactions])

  const filteredBookings = bookings.filter(b => {
    const isPaid = matchedUnits.has(b.unit_id)
    return bookingFilter === 'all'
      ? true
      : bookingFilter === 'paid'
      ? isPaid
      : !isPaid
  })

  // Build options for transaction dropdown: available or your booked units not yet paid
  const eligibleUnits = useMemo(() => {
    return allUnits
      .filter(u =>
        (!u.booked || bookedByYou.has(u.id)) &&
        !paidUnits.has(u.id)
      )
      .map(u => ({
        id: u.id,
        value: u.unit_id,
        label: u.booked
          ? `${u.unit_id} — $${u.price} (Booked by you)`
          : `${u.unit_id} — $${u.price} (Available)`
      }))
  }, [allUnits, bookedByYou, paidUnits])
  
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
        setTxUnit(bk.data.bookings[0].unit_id)
      }
      setTxAmount('')
    } catch (err: any) {
      setTxError(err.response?.data?.message || 'Failed to record transaction')
    } finally {
      setTxLoading(false)
    }
  }

  useEffect(() => {
    if (txError || txSuccess) {
      const timer = setTimeout(() => {
        setTxError(null)
        setTxSuccess(null)
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [txError, txSuccess])


  // Lookup maps for quick access
  const unitIdToUnit = new Map(allUnits.map(u => [u.unit_id, u])) 
  const projectIdToName = new Map(projects.map(p => [p.id, p.name]))


  return (
    <ProtectedRoute roles={['buyer']}>
      <div className="space-y-12">

        {/* Page title */}
        <h1 className="text-3xl font-bold">Buyer Dashboard</h1>
        <ul className="nav nav-tabs" id="myTab" role="tablist">
          <li className="nav-item" role="presentation">
            <button className="nav-link active" id="projects-tab" data-bs-toggle="tab" data-bs-target="#projects" type="button" role="tab" aria-controls="projects" aria-selected="false">
              Browse Projects
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button className="nav-link" id="unmatched-tab" data-bs-toggle="tab" data-bs-target="#bookings" type="button" role="tab" aria-controls="unmatched" aria-selected="false">
              Your Bookings
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button className="nav-link" id="matched-tab" data-bs-toggle="tab" data-bs-target="#payment" type="button" role="tab" aria-controls="matched" aria-selected="false">
              Make a Payment
            </button>
          </li>
        </ul>

        <div className='tab-content p-4' id="myTabContent">
          {/* Projects section: browse all available projects */}
          <section className='tab-pane fade show active p-4' id='projects'>
            <h2 className="text-2xl font-bold mb-4">Browse Projects</h2>
            {projects.length === 0 ? (
              <p>No projects available.</p>
            ) : (
              <ul className="grid grid-cols-[max-content] gap-2">
                {projects.map(p => (
                  <li className='my-card-clickable mt-4 rounded' key={p.id}>
                    <Link href={`/projects/${p.id}`} className="block p-4 rounded shadow hover:no-underline">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-sm">{p.location}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {/* Your Bookings section */}
          <section className='tab-pane fade' id='bookings'>
            <h2 className="text-xl font-semibold mb-4">Your Bookings</h2>

            {/* Filter buttons */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm">Show:</span>
              {['all', 'paid', 'unpaid'].map(status => (
                <button
                  key={status}
                  onClick={() => setBookingFilter(status as 'all' | 'paid' | 'unpaid')}
                  className={`px-2 py-1 rounded text-sm btn 
                    ${bookingFilter === status ? 'btn-primary' : 'btn-outline-secondary'}`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Booking list */}
            {filteredBookings.length === 0 ? (
              <p>You have no bookings yet.</p>
            ) : (
              <ul className="grid grid-cols gap-2">
                {filteredBookings.map(b => {
                  const unit = unitIdToUnit.get(b.unit_number)
                  const projectName = unit ? projectIdToName.get(unit.project_id) : 'Unknown Project'
                  const isPaid = matchedUnits.has(b.unit_id)

                  return (
                    <li key={b.id} className="p-4 rounded shadow my-card mt-4 space-y-3">
                      <div className="text-lg fs-5"><strong>Unit {b.unit_number}</strong></div>

                      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <dt className="font-medium">Project:</dt>
                        <dd>{projectName}</dd>

                        <dt className="font-medium">Amount:</dt>
                        <dd>${b.amount}</dd>

                        <dt className="font-medium">Date:</dt>
                        <dd>
                          {new Date(b.date).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </dd>

                        <dt className="font-medium">Status:</dt>
                        <dd className={isPaid ? 'text-success' : 'text-danger'}>
                          {isPaid ? 'Paid' : 'Unpaid'}
                        </dd>
                      </dl>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
          {/* Make a Payment section */}
          <section className='tab-pane fade' id='payment'>
            <h2 className="text-xl font-semibold mb-4">Make a Payment</h2>
            <form
              onSubmit={handleTransaction}
              className="flex flex-col gap-4 w-1/2 p-4 rounded shadow my-card"
            >
              {/* Unit dropdown */}
              <div>
                <label htmlFor="txUnit" className="block text-sm font-medium mb-1">
                  Unit
                </label>
                <select
                  id="txUnit"
                  value={txUnit}
                  onChange={e => setTxUnit(Number(e.target.value))}
                  className="mt-1 block w-full border rounded p-2"
                  required
                >
                  <option value="" disabled hidden>
                    Select Unit…
                  </option>
                  {eligibleUnits.map(o => (
                    <option key={o.value} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* Amount input */}
              <div>
                <label htmlFor="txAmount" className="block text-sm font-medium mb-1">
                  Amount
                </label>
                <input
                  id="txAmount"
                  type="number"
                  value={txAmount}
                  placeholder="Amount"
                  onChange={e => setTxAmount(e.target.value)}
                  className="mt-1 block w-full border rounded p-2"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              {/* Date/time picker */}
              <div>
                <label htmlFor="txDate" className="block text-sm font-medium mb-1">
                  Transaction Date &amp; Time
                </label>
                <input
                  id="txDate"
                  type="datetime-local"
                  value={txDate}
                  onChange={e => setTxDate(e.target.value)}
                  className="mt-1 block w-full border rounded p-2"
                  required
                />
              </div>
              {/* Payment method selector */}
              <div>
                <label htmlFor="txMethod" className="block text-sm font-medium mb-1">
                  Payment Method
                </label>
                <select
                  id="txMethod"
                  value={txMethod}
                  onChange={e => setTxMethod(e.target.value as any)}
                  className="mt-1 block w-full border rounded p-2"
                  required
                >
                  <option value="" disabled hidden>
                    Select Method…
                  </option>
                  <option value="bank transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              {/* Form messages */}
              {txError && <p className="text-danger text-sm">{txError}</p>}
              {txSuccess && <p className="text-success text-sm">{txSuccess}</p>}
              {/* Submit button */}
              <button
                type="submit"
                disabled={txLoading}
                className="px-4 py-2 rounded disabled:opacity-50 btn btn-custom"
              >
                {txLoading ? 'Recording…' : 'Record Transaction'}
              </button>
            </form>
          </section>
        </div>

      </div>
    </ProtectedRoute>
  )
}