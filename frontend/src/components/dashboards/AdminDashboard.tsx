// AdminDashboard.tsx
// React component for the bank admin dashboard, showing builders, projects, bookings, and transactions.
// - Protects route to users with 'admin' role.
// - Fetches initial data on mount and provides filtering/search capabilities.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import api from '@/lib/api'

// Data interfaces for type safety
interface Builder {
  id: number
  name: string
  email: string
}

interface Project {
  id: number
  name: string
  location: string
}

interface Booking {
  id: number
  project_name: string
  unit_number: string
  buyer_name: string
  amount: number
  date: string
}

interface Transaction {
  id: number
  unit_number: string
  buyer_name: string
  amount: number
  date: string
  payment_method: string
  booking_id: number | null
}

export default function AdminDashboard() {
  // State hooks for storing data and filtered subsets
  const [builders, setBuilders]               = useState<Builder[]>([])
  const [projects, setProjects]               = useState<Project[]>([])
  const [displayProjects, setDisplayProjects] = useState<Project[]>([])
  const [bookings, setBookings]               = useState<Booking[]>([])
  const [displayBookings, setDisplayBookings] = useState<Booking[]>([])
  const [transactions, setTransactions]       = useState<Transaction[]>([])

  // Filter/search state
  const [builderFilter, setBuilderFilter]   = useState<number|null>(null)
  const [projectSearch, setProjectSearch]   = useState<string>('')
  const [bookingSearch, setBookingSearch]   = useState<string>('')

  // 1) Fetch all data once when component mounts
  useEffect(() => {
    api.get('/admin/builders')
       .then(r => setBuilders(r.data.builders))
       .catch(console.error)

    api.get('/admin/projects')
       .then(r => {
         setProjects(r.data.projects)
         setDisplayProjects(r.data.projects)
       })
       .catch(console.error)

    api.get('/admin/bookings')
       .then(r => {
         setBookings(r.data.bookings)
         setDisplayBookings(r.data.bookings)
       })
       .catch(console.error)

    api.get('/admin/transactions')
       .then(r => setTransactions(r.data.transactions))
       .catch(console.error)
  }, [])

  // 2) Update displayed projects when builder selection changes
  useEffect(() => {
    if (builderFilter !== null) {
      // Fetch projects for selected builder only
      api.get('/admin/projects/filter', { params: { builder_id: builderFilter } })
         .then(r => setDisplayProjects(r.data.projects))
         .catch(console.error)
    } else {
      // No filter: show all projects
      setDisplayProjects(projects)
    }
    // Reset project search when builder changes
    setProjectSearch('')
  }, [builderFilter, projects])

  // 3) Apply project name search via general filter endpoint
  useEffect(() => {
    if (projectSearch) {
      api.get('/admin/filter', { params: { project_name: projectSearch } })
         .then(r => setDisplayProjects(r.data.projects))
         .catch(console.error)
    } else if (builderFilter === null) {
      // No search & no builder filter: restore full list
      setDisplayProjects(projects)
    }
  }, [projectSearch, builderFilter, projects])

  // 4) Apply booking search for buyer or unit
  useEffect(() => {
    if (bookingSearch) {
      api.get('/admin/bookings/search', { params: { q: bookingSearch } })
         .then(r => setDisplayBookings(r.data.bookings))
         .catch(console.error)
    } else {
      // Clear booking search: show all bookings
      setDisplayBookings(bookings)
    }
  }, [bookingSearch, bookings])

  return (
    <ProtectedRoute roles={[ 'admin' ]}>
      <div className="p-6 space-y-8">

        {/* Page header */}
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        {/* Builders list with filter buttons */}
        <section>
          <h2 className="text-2xl font-semibold mb-2">Registered Builders</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {builders.map(b => (
              <li key={b.id}>
                <button
                  onClick={() => setBuilderFilter(b.id)}
                  className={`w-full text-left p-4 bg-white rounded shadow hover:bg-gray-50 ${
                    builderFilter === b.id ? 'ring-2 ring-blue-600' : ''
                  }`}
                >
                  {b.name} — {b.email}
                </button>
              </li>
            ))}
            {/* Show reset button when a builder is selected */}
            {builderFilter !== null && (
              <li>
                <button
                  onClick={() => setBuilderFilter(null)}
                  className="w-full p-4 bg-red-100 rounded hover:bg-red-200"
                >
                  Clear Builder Filter
                </button>
              </li>
            )}
          </ul>
        </section>

        {/* Projects with search input */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Projects</h2>
            <input
              type="text"
              placeholder="Search projects…"
              value={projectSearch}
              onChange={e => setProjectSearch(e.target.value)}
              className="border rounded p-2 w-64"
            />
          </div>
          {displayProjects.length === 0 ? (
            <p>No projects found.</p>
          ) : (
            <ul className="space-y-2">
              {displayProjects.map(p => (
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

        {/* Bookings with search */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Bookings</h2>
            <input
              type="text"
              placeholder="Search buyer or unit…"
              value={bookingSearch}
              onChange={e => setBookingSearch(e.target.value)}
              className="border rounded p-2 w-64"
            />
          </div>
          {displayBookings.length === 0 ? (
            <p>No bookings found.</p>
          ) : (
            <ul className="space-y-2">
              {displayBookings.map(b => (
                <li key={b.id} className="p-4 bg-white rounded shadow">
                  <div><strong>Project:</strong> {b.project_name}</div>
                  <div><strong>Unit:</strong> {b.unit_number}</div>
                  <div><strong>Buyer:</strong> {b.buyer_name}</div>
                  <div><strong>Amount:</strong> ${b.amount}</div>
                  <div><strong>Date:</strong> {b.date}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Transactions log */}
        <section className="space-y-2">
          <h2 className="text-2xl font-semibold">Transactions Log</h2>
          {transactions.length === 0 ? (
            <p>No transactions recorded.</p>
          ) : (
            <ul className="space-y-2">
              {transactions.map(t => (
                <li key={t.id} className="p-4 bg-white rounded shadow">
                  <div><strong>Txn ID:</strong> {t.id}</div>
                  <div><strong>Unit:</strong> {t.unit_number}</div>
                  <div><strong>Buyer:</strong> {t.buyer_name}</div>
                  <div><strong>Amount:</strong> ${t.amount}</div>
                  <div><strong>Date:</strong> {t.date}</div>
                  <div><strong>Method:</strong> {t.payment_method}</div>
                  <div>
                    <strong>Booking ID:</strong>{' '}
                    {t.booking_id !== null ? t.booking_id : 'unmatched'}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </ProtectedRoute>
  )
}