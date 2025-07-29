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
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

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
  const [txUnit, setTxUnit] = useState<number>(0);
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
        value: u.id,
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

  const projectStats = useMemo(() => {
    const stats = new Map<number, {
      project_id: number
      name: string
      units_per_project: number
      bookings_per_project: number
      amount_per_project: number
      unmatched_transactions_per_project: number
    }>()

    // Pre-index units by project
    for (const unit of allUnits) {
      if (!stats.has(unit.project_id)) {
        stats.set(unit.project_id, {
          project_id: unit.project_id,
          name: projectIdToName.get(unit.project_id) || 'Unknown',
          units_per_project: 0,
          bookings_per_project: 0,
          amount_per_project: 0,
          unmatched_transactions_per_project: 0,
        })
      }
      stats.get(unit.project_id)!.units_per_project += 1
    }

    // Count bookings
    for (const booking of bookings) {
      const unit = unitIdToUnit.get(booking.unit_number)
      if (!unit) continue

      const s = stats.get(unit.project_id)
      if (!s) continue

      s.bookings_per_project += 1
      s.amount_per_project += booking.amount
    }

    // Unmatched transactions
    for (const tx of transactions) {
      if (tx.booking_id !== null) continue // matched

      const unit = allUnits.find(u => u.id === tx.unit_id)
      if (!unit) continue

      const s = stats.get(unit.project_id)
      if (!s) continue

      s.unmatched_transactions_per_project += 1
    }

    return Array.from(stats.values())
  }, [allUnits, bookings, transactions, projectIdToName, unitIdToUnit])

  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042',
    '#A28EF0', '#FF6666', '#66CC99', '#FF9933',
    '#3399FF', '#FF66CC', '#99CC00', '#FFCC00',
    '#66FFFF', '#9966FF', '#FF99CC', '#669999',
    '#FFB347', '#B6D7A8', '#E06666', '#F6B26B'
  ]

  // Convert projectStats into pie chart datasets
  const unitsData = projectStats.map(p => ({ name: p.name, value: p.units_per_project }))
  const bookingsData = projectStats.map(p => ({ name: p.name, value: p.bookings_per_project }))
  const amountData = projectStats.map(p => ({ name: p.name, value: p.amount_per_project }))
  const unmatchedData = projectStats.map(p => ({ name: p.name, value: p.unmatched_transactions_per_project }))

  const [selectedProject, setSelectedProject] = useState<string | null>(null)



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
            <button className="nav-link" id="stats-tab" data-bs-toggle="tab" data-bs-target="#stats" type="button" role="tab" aria-controls="stats" aria-selected="false">
              Project Stats
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
          <section className='tab-pane fade' id='stats'>
            <h2 className="text-xl font-semibold mb-4">Project Stats</h2>

            {projectStats.length === 0 ? (
              <p>No project stats to show.</p>
            ) : (
              <>
                {/* PIE CHARTS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-8">
                  {[
                    { title: 'Units per Project', data: unitsData },
                    { title: 'Bookings per Project', data: bookingsData },
                    { title: 'Total Amount per Project', data: amountData },
                    { title: 'Unmatched Transactions', data: unmatchedData }
                  ].map((chart, index) => (
                    <div key={chart.title} className="p-4 rounded shadow my-card mt-4">
                      <h3 className="text-md font-semibold mb-2">{chart.title}</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={chart.data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                            onClick={(entry, i) => {
                              setSelectedProject(prev =>
                                prev === entry.name ? null : entry.name
                              )
                            }}
                          >
                            {chart.data.map((_, i) => (
                              <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ))}
                </div>

                {/* FILTERED PROJECT CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {(selectedProject
                    ? projectStats.filter(stat => stat.name === selectedProject)
                    : projectStats
                  ).map(stat => (
                    <div key={stat.project_id} className="p-4 rounded shadow my-card space-y-2">
                      <div className="text-lg font-bold">{stat.name}</div>
                      <ul className="text-sm space-y-1">
                        <li><strong>Units:</strong> {stat.units_per_project}</li>
                        <li><strong>Bookings:</strong> {stat.bookings_per_project}</li>
                        <li><strong>Total Amount:</strong> ${stat.amount_per_project.toFixed(2)}</li>
                        <li><strong>Unmatched Transactions:</strong> {stat.unmatched_transactions_per_project}</li>
                      </ul>
                    </div>
                  ))}
                </div>
              </>
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
                    <option key={o.id} value={o.id}>
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