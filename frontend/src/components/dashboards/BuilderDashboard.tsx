// BuilderDashboard.tsx
import React, { useState, useEffect, ReactNode } from 'react'
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { schemeSet3 } from 'd3-scale-chromatic'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// Interfaces
interface ProjectMetrics {
  project_id: number
  name: string
  units_per_project: number
  bookings_per_project: number
  amount_per_project: number
  unmatched_transactions_per_project: number
}

interface Stats {
  total_projects: number
  total_units: number
  units_booked: number
  total_booking_amount: number
  unmatched_transactions: number
  per_project: ProjectMetrics[]
}

interface Project { id: number; name: string; location: string }

interface Booking {
  id: number
  unit_code: string
  buyer_name: string
  amount: number
  date: string
}

interface Transaction {
  id: number
  amount: number
  booking_id: number | null
}

export default function BuilderDashboard() {
  const { user } = useAuth()

  const [stats, setStats] = useState<Stats | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [txs, setTxs] = useState<Transaction[]>([])
  const [matchInputs, setMatchInputs] = useState<Record<number, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)

  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js')
  }, [])

  useEffect(() => {
    const hash = window.location.hash?.replace('#', '')
    if (hash) {
      const el = document.querySelector(`button[data-bs-target="#${hash}"]`) as HTMLElement
      if (el) el.click()
    }
  }, [])

  const loadAll = () => {
    setIsLoading(true)
    Promise.all([
      api.get('/builder/dashboard'),
      api.get('/builder/projects'),
      api.get('/builder/bookings'),
      api.get('/builder/transactions')
    ]).then(([statsRes, projectsRes, bookingsRes, txsRes]) => {
      if (statsRes.data.status === 'success') setStats(statsRes.data)
      if (projectsRes.data.status === 'success') setProjects(projectsRes.data.projects)
      if (bookingsRes.data.status === 'success') setBookings(bookingsRes.data.bookings)
      if (txsRes.data.status === 'success') setTxs(txsRes.data.transactions)
    }).catch(console.error)
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    if (user) loadAll()
  }, [user])

  const unmatched = txs.filter(t => t.booking_id === null)
  const matched = txs.filter(t => t.booking_id !== null)

  const matchedBookingIds = new Set(matched.map(t => t.booking_id!))
  const availableBookings = bookings.filter(b => !matchedBookingIds.has(b.id))

  const handleMatch = async (txId: number) => {
    const bookingId = matchInputs[txId]
    if (!bookingId) return alert('Select a booking first')
    try {
      await api.post('/builder/transactions/match', { transaction_id: txId, booking_id: bookingId })
      loadAll()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Match failed')
    }
  }

  const getColor = (index: number) => schemeSet3[index + 1 % schemeSet3.length]

  return (
    <ProtectedRoute roles={['builder']}>
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Builder Dashboard</h1>

        <ul className="nav nav-tabs border-b" id="myTab" role="tablist">
          <li className="nav-item" role="presentation">
            <button className="nav-link active" id="overview-tab" data-bs-toggle="tab" data-bs-target="#overview" type="button" role="tab" onClick={() => window.location.hash = 'overview'}>Overview</button>
          </li>
          <li className="nav-item" role="presentation">
            <button className="nav-link" id="projects-tab" data-bs-toggle="tab" data-bs-target="#projects" type="button" role="tab" onClick={() => window.location.hash = 'projects'}>Projects</button>
          </li>
          <li className="nav-item" role="presentation">
            <button className="nav-link" id="transactions-tab" data-bs-toggle="tab" data-bs-target="#transactions" type="button" role="tab" onClick={() => window.location.hash = 'transactions'}>Transactions</button>
          </li>
        </ul>

        <div className="tab-content" id="myTabContent">
          {/* Overview Tab */}
          <div className="tab-pane fade show active p-4" id="overview" role="tabpanel">
            {isLoading ? <p>Loading...</p> : stats ? (
              <div className="flex flex-row flex-wrap gap-4">
                <Card label="Total Projects" value={stats.total_projects} />
                <Card label="Total Units" value={stats.total_units}>
                  <PieChart width={150} height={150}>
                    <Pie
                      data={stats.per_project}
                      dataKey="units_per_project"
                      nameKey="name"
                      cx="50%" cy="50%"
                      outerRadius="75%"                      
                      onClick={(_, index) => {
                        const project = stats.per_project[index]
                        setSelectedProjectId(prev => prev === project.project_id ? null : project.project_id)
                      }}
                    >
                      {stats.per_project.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={getColor(index)} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </Card>
                <Card label="Booked Units" value={stats.units_booked}>
                  <PieChart width={150} height={150}>
                    <Pie
                      data={stats.per_project}
                      dataKey="bookings_per_project"
                      nameKey="name"
                      cx="50%" cy="50%"
                      outerRadius="75%"                      
                      onClick={(_, index) => {
                        const project = stats.per_project[index]
                        setSelectedProjectId(prev => prev === project.project_id ? null : project.project_id)
                      }}
                    >
                      {stats.per_project.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={getColor(index)} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </Card>

                <Card label="Total Booking Amount" value={`$${stats.total_booking_amount.toLocaleString()}`}>
                  <PieChart width={150} height={150}>
                    <Pie
                      data={stats.per_project}
                      dataKey="amount_per_project"
                      nameKey="name"
                      cx="50%" cy="50%"
                      outerRadius="75%"                      
                      onClick={(_, index) => {
                        const project = stats.per_project[index]
                        setSelectedProjectId(prev => prev === project.project_id ? null : project.project_id)
                      }}
                    >
                      {stats.per_project.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={getColor(index)} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </Card>

                <Card label="Unmatched Txns" value={stats.unmatched_transactions}>
                  <PieChart width={150} height={150}>
                    <Pie
                      data={stats.per_project}
                      dataKey="unmatched_transactions_per_project"
                      nameKey="name"
                      cx="50%" cy="50%"
                      outerRadius="75%"                      
                      onClick={(_, index) => {
                        const project = stats.per_project[index]
                        setSelectedProjectId(prev => prev === project.project_id ? null : project.project_id)
                      }}
                    >
                      {stats.per_project.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={getColor(index)} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </Card>

                {/* Selected Project Details */}
                {selectedProjectId !== null && (() => {
                  const project = stats.per_project.find(p => p.project_id === selectedProjectId)
                  if (!project) return null
                  return (
                    <div className="flex flex-wrap gap-4 mt-4 pt-4 w-full">
                      <Card label={`${project.name}: Units`} value={project.units_per_project} />
                      <Card label={`${project.name}: Bookings`} value={project.bookings_per_project} />
                      <Card label={`${project.name}: Amount`} value={`$${project.amount_per_project.toLocaleString()}`} />
                      <Card label={`${project.name}: Unmatched Txns`} value={project.unmatched_transactions_per_project} />
                    </div>
                  )
                })()}
              </div>
            ) : <div>
              <p>No projects yet!</p>
              <Link href="/projects/new" className="px-4 py-2 rounded btn btn-custom">Add Project</Link>
            </div>}
          </div>

          {/* Projects Tab */}
          <div className="tab-pane fade p-4" id="projects" role="tabpanel">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Your Projects</h2>
              <Link href="/projects/new" className="px-4 py-2 rounded btn btn-custom">Add Project</Link>
            </div>
            {isLoading ? <p>Loading projects...</p> : projects.length === 0 ? (
              <p>No projects yet.</p>
            ) : (
              <ul className="space-y-2">
                {projects.map(p => (
                  <li key={p.id}>
                    <Link href={`/projects/${p.id}`} className="block p-4 rounded shadow w-1/7 m-4 my-card-clickable">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-sm">{p.location}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Transactions Tab */}
          <div className="tab-pane fade p-4 shadow rounded w-3/4 mx-auto my-card" id="transactions" role="tabpanel">
            {/* Unmatched Transactions */}
            <h2 className="text-2xl font-semibold mb-4">Unmatched Transactions</h2>
            {isLoading ? <p>Loading transactions...</p> : unmatched.length === 0 ? (
              <p>No Unmatched Transactions.</p>
            ) : unmatched.map(tx => (
              <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 p-4 rounded border mb-3">
                <div className=''>ID: {tx.id} ${tx.amount.toLocaleString()}</div>
                <select className="border rounded p-2" onChange={e => setMatchInputs({ ...matchInputs, [tx.id]: Number(e.target.value) })}>
                  <option value="">— choose booking —</option>
                  {availableBookings.map(b => (
                    <option key={b.id} value={b.id}>{b.id}: {b.unit_code} — ${b.amount.toLocaleString()} by {b.buyer_name}</option>
                  ))}
                </select>
                <button onClick={() => handleMatch(tx.id)} className="mt-3 sm:mt-0 px-4 py-2 rounded btn btn-custom">Match</button>
              </div>
            ))}
            {/* Matched Transactions */}
            <h2 className="text-2xl font-semibold mt-5 mb-4">Matched Transactions</h2>
            {isLoading ? <p>Loading transactions...</p> : matched.length === 0 ? (
              <p>No matched transactions yet.</p>
            ) : (
              <ul className="space-y-2">
                {matched.map(tx => (
                  <li key={tx.id} className="p-4 rounded shadow m-4 my-card">
                    <div>ID: {tx.id}</div>
                    <div>Amount: ${tx.amount.toLocaleString()}</div>
                    <div>Booking ID: {tx.booking_id}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

// Reusable Card component for displaying key-value metrics
function Card({ label, value, children }: { label: string; value: string|number; children?: ReactNode }) {
  return (
    <div className="p-4 rounded shadow-lg flex flex-col items-center my-card">
      <p className="text-sm"><strong>{label}</strong></p>
      <p className="text-2xl font-semibold">{value}</p>
      {children && (
        <div>
          {children}
        </div>
      )}
    </div>
  )
}