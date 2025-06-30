import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'

interface Project {
  id: number
  name: string
  location: string
  builder_name: string
}
interface Unit {
  id: number
  number: string
  floor: number
  area: number
  price: number
  booked: boolean
}

export default function ProjectDetail() {
  const router = useRouter()
  const { projectId } = router.query as { projectId?: string }
  const { user } = useAuth()

  const [project, setProject] = useState<Project | null>(null)
  const [units, setUnits]     = useState<Unit[]>([])
  const [bookingFormFor, setBookingFormFor]     = useState<number | null>(null)
  const [amountInput,   setAmountInput]         = useState<string>('')
  const [methodInput,   setMethodInput]         = useState<'Cash'|'Bank Transfer'>('Bank Transfer')
  const [bookingError,  setBookingError]        = useState<string|null>(null)
  const [loadingBooking, setLoadingBooking]     = useState(false)

  // choose URL-prefix by role
  const prefix =
    user?.role === 'builder'
      ? '/builder/projects'
      : user?.role === 'buyer'
      ? '/buyer/projects'
      : '/admin/projects'

  useEffect(() => {
    if (!projectId) return
    // 1️⃣ fetch project (including builderName)
    api
      .get(`${prefix}/${projectId}`)
      .then(res => setProject(res.data.project))
      .catch(console.error)

    // 2️⃣ fetch units list
    api
      .get(`${prefix}/${projectId}/units`)
      .then(res => setUnits(res.data.units))
      .catch(console.error)
  }, [projectId, prefix])

  if (!project) return <p>Loading…</p>

  const submitBooking = async (u: Unit) => {
    setBookingError(null)
    const amt = parseFloat(amountInput)
    if (isNaN(amt) || amt < u.price) {
      setBookingError(`Amount must be at least $${u.price}`)
      return
    }
    setLoadingBooking(true)
    try {
      await api.post('/buyer/bookings', {
        unit_id: u.id,
        booking_amount: amt,
        payment_method: methodInput,
        booking_date: new Date().toISOString(),
      })
      // refresh
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
      <div className="space-y-6">
        {/* Project header */}
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-gray-600">Location: {project.location}</p>
        <p className="text-gray-600">Builder: {project.builder_name}</p>

        {/* Units */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Units</h2>
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
              {/* for buyer, show a little description list */}
              {user?.role === 'buyer' ? (
                <>
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-medium">Unit {u.number}</div>
                    <div className={u.booked ? 'text-red-600' : 'text-green-600'}>
                      {u.booked ? 'Booked' : 'Available'}
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <dt className="font-medium">Floor:</dt>
                    <dd>{u.floor}</dd>
                    <dt className="font-medium">Area:</dt>
                    <dd>{u.area} sqft</dd>
                    <dt className="font-medium">Price:</dt>
                    <dd>${u.price}</dd>
                  </dl>

                  {/* inline book form if available */}
                  {!u.booked && (
                    bookingFormFor === u.id ? (
                      <div className="border-t pt-3 space-y-2">
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
                        <div>
                          <label className="block text-sm">Payment Method</label>
                          <select
                            value={methodInput}
                            onChange={e => setMethodInput(e.target.value as any)}
                            className="mt-1 w-full border rounded p-2"
                          >
                            <option>Bank Transfer</option>
                            <option>Cash</option>
                          </select>
                        </div>
                        {bookingError && (
                          <p className="text-red-500 text-sm">{bookingError}</p>
                        )}
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
                          >
                            Cancel
                          </button>
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
                      >
                        Book this unit
                      </button>
                    )
                  )}
                </>
              ) : (
                // builder & admin: simpler listing + details link
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Unit {u.number}</div>
                    <div className="text-sm text-gray-500">
                      Floor {u.floor} · {u.area} sqft · ${u.price}{' '}
                      {u.booked && <span className="text-green-600">(Booked)</span>}
                    </div>
                  </div>
                  <Link
                    href={`/projects/${project.id}/units/${u.id}`}
                    className="text-indigo-600 hover:underline"
                  >
                    Details
                  </Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </ProtectedRoute>
  )
}