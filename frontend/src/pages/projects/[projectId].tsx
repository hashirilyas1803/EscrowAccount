// ProjectDetail.tsx
// Page component showing details for a specific project and its units.
// - Accessible to builder, buyer, and admin roles.
// - Fetches project info and unit list on mount.
// - Provides booking form inline for buyers and unit management links for builders/admins.

import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'

// Interface for project data including builder's name
interface Project {
  id: number
  name: string
  location: string
  builder_name: string
}

// Interface for unit rows within a project
interface Unit {
  id: number
  unit_id: string     // public unit code
  floor: number
  area: number
  price: number
  booked: boolean     // indicates if unit is already booked
}

export default function ProjectDetail() {
  const router = useRouter()
  const { projectId } = router.query as { projectId?: string }
  const { user } = useAuth()

  // Local state for project info and units
  const [project, setProject] = useState<Project | null>(null)
  const [units, setUnits]     = useState<Unit[]>([])

  // State for buyer booking form inline
  const [bookingFormFor, setBookingFormFor] = useState<number | null>(null)
  const [amountInput, setAmountInput]       = useState<string>('')
  const [methodInput, setMethodInput]       = useState<'Cash'|'Bank Transfer'>('Bank Transfer')
  const [bookingError, setBookingError]     = useState<string|null>(null)
  const [loadingBooking, setLoadingBooking] = useState(false)

  // Determine API prefix for project routes based on role
  const prefix =
    user?.role === 'builder' ? '/builder/projects'
    : user?.role === 'buyer'  ? '/buyer/projects'
    : '/admin/projects'

  useEffect(() => {
    if (!projectId) return

    // 1️⃣ Fetch project details (including builder name)
    api.get(`${prefix}/${projectId}`)
      .then(res => setProject(res.data.project))
      .catch(console.error)

    // 2️⃣ Fetch units belonging to this project
    api.get(`${prefix}/${projectId}/units`)
      .then(res => setUnits(res.data.units))
      .catch(console.error)
  }, [projectId, prefix])

  // Show loading state until project data is available
  if (!project) return <p>Loading…</p>

  // Handler for submitting a new booking (buyer only)
  const submitBooking = async (u: Unit) => {
    setBookingError(null)
    const amt = parseFloat(amountInput)
    // Validate amount against unit price
    if (isNaN(amt) || amt < u.price) {
      setBookingError(`Amount must be at least $${u.price}`)
      return
    }
    setLoadingBooking(true)
    try {
      // Call booking endpoint
      await api.post('/buyer/bookings', {
        unit_id: u.unit_id,
        booking_amount: amt,
        payment_method: methodInput,
        booking_date: new Date().toISOString(),
      })
      // Refresh unit list to reflect new booking
      const updated = await api.get(`${prefix}/${projectId}/units`)
      setUnits(updated.data.units)
      setBookingFormFor(null)
    } catch (err: any) {
      setBookingError(err.response?.data?.message || 'Booking failed')
    } finally {
      setLoadingBooking(false)
    }
  }

  return (
    <ProtectedRoute roles={['builder','buyer','admin']}>
      <div className="space-y-6 p-6">
        {/* Project header info */}
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-gray-600">Location: {project.location}</p>
        <p className="text-gray-600">Builder: {project.builder_name}</p>

        {/* Units section with conditional actions */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Units</h2>
          {/* Builders can add new units */}
          {user?.role === 'builder' && (
            <Link
              href={`/projects/${project.id}/units/new`}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              + Add Unit
            </Link>
          )}
        </div>

        <ul className="space-y-4">
          {units.map(u => (
            <li key={u.id} className="bg-white rounded shadow p-4 space-y-3">
              {user?.role === 'buyer' ? (
                // Buyer sees detailed unit info and can book if available
                <>
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-medium">Unit {u.unit_id}</div>
                    <div className={u.booked ? 'text-red-600' : 'text-green-600'}>
                      {u.booked ? 'Booked' : 'Available'}
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <dt className="font-medium">Floor:</dt><dd>{u.floor}</dd>
                    <dt className="font-medium">Area:</dt><dd>{u.area} sqft</dd>
                    <dt className="font-medium">Price:</dt><dd>${u.price}</dd>
                  </dl>

                  {/* Inline booking form if unit not booked */}
                  {!u.booked && (
                    bookingFormFor === u.id ? (
                      <div className="border-t pt-3 space-y-2">
                        {/* Amount input */}
                        <div>
                          <label className="block text-sm">Amount</label>
                          <input
                            type="number"
                            value={amountInput}
                            onChange={e => setAmountInput(e.target.value)}
                            className="mt-1 w-full border rounded p-2"
                            min={u.price}
                            required
                          />
                        </div>
                        {/* Error message */}
                        {bookingError && (
                          <p className="text-red-500 text-sm">{bookingError}</p>
                        )}
                        {/* Confirm/Cancel buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => submitBooking(u)}
                            disabled={loadingBooking}
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {loadingBooking ? 'Booking…' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setBookingFormFor(null)}
                            className="px-3 py-1 rounded border"
                          >Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setBookingFormFor(u.id)
                          setAmountInput(u.price.toString())
                          setBookingError(null)
                        }}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >Book this unit</button>
                    )
                  )}
                </>
              ) : (
                // Builder/Admin view: concise unit info with details link
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Unit {u.unit_id}</div>
                    <div className="text-sm text-gray-500">
                      Floor {u.floor} · {u.area} sqft · ${u.price}{' '}
                      {u.booked && <span className="text-green-600">(Booked)</span>}
                    </div>
                  </div>
                  <Link
                    href={`/projects/${project.id}/units/${u.id}`}
                    className="text-indigo-600 hover:underline"
                  >Details</Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </ProtectedRoute>
  )
}