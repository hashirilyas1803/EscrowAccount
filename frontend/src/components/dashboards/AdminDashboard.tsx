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
  
  // Import Bootstrap JS for tab functionality
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

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
      <div className="space-y-12">

        {/* Page header */}
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        
        {/* Tab Navigation */}
        <ul className="nav nav-tabs" id="adminTab" role="tablist">
          <li className="nav-item" role="presentation">
            <button className="nav-link active" id="projects-tab" data-bs-toggle="tab" data-bs-target="#projects" type="button" role="tab" aria-controls="projects" aria-selected="false">
              Projects
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button className="nav-link" id="bookings-tab" data-bs-toggle="tab" data-bs-target="#bookings" type="button" role="tab" aria-controls="bookings" aria-selected="false">
              Bookings
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button className="nav-link" id="transactions-tab" data-bs-toggle="tab" data-bs-target="#transactions" type="button" role="tab" aria-controls="transactions" aria-selected="false">
              Transactions
            </button>
          </li>
        </ul>
        
        {/* Tab Content */}
        <div className='tab-content p-4' id="adminTabContent">
        
          {/* Builders list with filter buttons */}
          <section className='tab-pane fade show active' id='projects'>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Registered Builders</h2>

                {/* Show the active filter as a pill */}
                {builderFilter !== null && (
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1.5 rounded-full text-sm">
                      {
                        // find the name for the active builder
                        builders.find(b => b.id === builderFilter)?.name
                      }
                    </span>
                    <button
                      onClick={() => setBuilderFilter(null)}
                      className="btn btn-custom text-sm"
                      aria-label="Clear builder filter"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {builders.map((b) => {
                const isActive = builderFilter === b.id;
                return (
                  <li key={b.id}>
                    <button
                      onClick={() => setBuilderFilter(b.id)}
                      className={`
                        w-full text-left p-4 rounded shadow transition btn my-card
                        ${isActive
                          ? 'active'
                          : ''}
                      `}
                      aria-pressed={isActive}
                    >
                      <div className="text-sm">{b.name}</div>
                      <div className="text-sm">{b.email}</div>
                    </button>
                  </li>
                );
              })}
            </ul>
            {/* Projects with search input */}
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
                  <li className='mt-4 my-card' key={p.id}>
                    <Link
                      href={`/projects/${p.id}`}
                      className="block p-4 rounded shadow"
                    >
                      <div className="font-medium">{p.name}</div>
                      <div className="text-sm">{p.location}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Bookings with search */}
          <section className='tab-pane fade space-y-2' id='bookings'>
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
                  <li key={b.id} className="p-4 rounded shadow my-card mt-4">
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
          <section className='tab-pane fade space-y-2' id='transactions'>
            <h2 className="text-2xl font-semibold">Transactions Log</h2>
            {transactions.length === 0 ? (
              <p>No transactions recorded.</p>
            ) : (
              <ul className="space-y-2">
                {transactions.map(t => (
                  <li key={t.id} className="p-4 rounded shadow my-card mt-4">
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
        
      </div>
    </ProtectedRoute>
  )
}