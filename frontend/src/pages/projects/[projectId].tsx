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
  
  const [multi, setMulti] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const [filter, setFilter] = useState<'all' | 'booked' | 'available'>('all')


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

  const submitMultipleBookings = async (unitsToBook: Unit[]) => {
    setBookingError(null)
    setLoadingBooking(true)
    try {
      // Validate all units first
      for (const unit of unitsToBook) {
        if (unit.booked) {
          throw new Error(`Unit ${unit.unit_id} is already booked.`)
        }
      }

      // Make all booking calls in parallel
      await Promise.all(
        unitsToBook.map(unit =>
          api.post('/buyer/bookings', {
            unit_id: unit.unit_id,
            booking_amount: unit.price,
            payment_method: methodInput,
            booking_date: new Date().toISOString(),
          })
        )
      )

    // After all bookings, refresh the unit list once
    const updated = await api.get(`${prefix}/${projectId}/units`)
      setUnits(updated.data.units)
      setSelected([])
      setMulti(false)
    } catch (err: any) {
      setBookingError(err.response?.data?.message || err.message || 'Booking failed')
    } finally {
      setLoadingBooking(false)
    }
  }

  const filteredUnits = units.filter(u =>
    filter === 'all' ? true :
    filter === 'booked' ? u.booked :
    !u.booked
  )



  return (
    <ProtectedRoute roles={['builder','buyer','admin']}>
      <div className="space-y-6 p-6">
        {/* Project header info */}
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-gray-600">Location: {project.location}</p>
        <p className="text-gray-600">Builder: {project.builder_name}</p>

        {/* Units section with conditional actions */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold">Units</h2>

            <div className="flex items-center gap-2">
              <span className="text-sm">Show:</span>
              {['all', 'available', 'booked'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status as 'all' | 'booked' | 'available')}
                  className={`px-2 py-1 rounded text-sm btn 
                    ${filter === status ? 'btn-primary' : 'btn-outline-secondary'}`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {/* Builders can add new units */}
          {user?.role === 'builder' && (
            <div className='flex flex-row gap-4'>
              <Link
                href={`/projects/${project.id}/units/new`}
                className="px-3 py-1 rounded btn btn-secondary"
              >
                Add Unit
              </Link>
              <Link
                href={`/projects/${project.id}/units/new_batch`}
                className="px-3 py-1 rounded btn btn-secondary"
              >
                Add Multiple Units
              </Link>
            </div>
          )}
          {/*Buyers can book multiple units*/}
          {user?.role === 'buyer' && (
            <div className='flex flex-row gap-4 items-center'>
              <button
                onClick={() => {
                  setMulti(!multi)
                  setSelected([])
                }}
                className={`hover:underline rounded btn ${multi ? 'btn-danger' : 'btn-success'}`}
              >
                {multi ? 'Cancel' : 'Book Multiple Units'}
              </button>
              <div className="text-right text-lg font-medium">
                Total: $
                {selected
                  .map(id => units.find(u => u.id === id)?.price ?? 0)
                  .reduce((sum, p) => sum + p, 0)
                  .toLocaleString()}
              </div>
              {multi && (
                <button
                  onClick={async () => {
                    if (selected.length === 0) return alert('Pick at least one unit')
                    const selectedUnits = units.filter(u => selected.includes(u.id))
                    await submitMultipleBookings(selectedUnits)
                  }}
                  className="btn btn-success rounded disabled:opacity-50"
                >
                  Book {selected.length} Unit{selected.length > 1 ? 's' : ''}
                </button>
              )}
            </div>
          )}
        </div>

        <ul className="space-y-4">
          {filteredUnits.map(u => (
            <li key={u.id} className="rounded shadow p-4 space-y-3">
              {user?.role === 'buyer' ? (
                // Buyer sees detailed unit info and can book if available
                <>
                  {(multi && !u.booked) && (
                   <input
                     type="checkbox"
                     className="form-check-input mt-0"
                     checked={selected.includes(u.id)}
                     onChange={e => {
                       if (e.target.checked) {
                         setSelected([...selected, u.id])
                       } else {
                         setSelected(selected.filter(id => id !== u.id))
                       }
                     }}
                   />
                 )}
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-medium">Unit {u.unit_id}</div>
                    <div className={u.booked ? 'text-danger' : 'text-success'}>
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
                      <div className="pt-3 flex flex-col gap-4">
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
                          <p className="text-danger text-sm">{bookingError}</p>
                        )}
                        {/* Confirm/Cancel buttons */}
                        <div className="flex flex-row gap-2">
                          <button
                            onClick={() => submitBooking(u)}
                            disabled={loadingBooking}
                            className="px-3 py-1 rounded btn btn-success"
                          >
                            {loadingBooking ? 'Booking…' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setBookingFormFor(null)}
                            className="px-3 py-1 rounded border btn btn-danger"
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
                        className="px-3 py-1 rounded btn btn-success"
                      >Book this unit</button>
                    )
                  )}
                </>
              ) : (
                // Builder/Admin view: concise unit info with details link
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Unit {u.unit_id}</div>
                    <div className="text-sm">
                      Floor {u.floor} · {u.area} sqft · ${u.price}{' '}
                      {u.booked 
                        ? <span className="text-success">(Booked)</span>
                        : <span className="text-danger">(Available)</span>
                      }
                    </div>
                  </div>
                  <Link
                    href={`/projects/${project.id}/units/${u.id}`}
                    className="hover:underline btn btn-secondary"
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