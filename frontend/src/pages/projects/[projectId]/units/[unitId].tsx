// UnitDetail.tsx
// React component for displaying detailed information about a single unit.
// - Accessible to admin, builder, and buyer roles.
// - Fetches unit data, booking, and transaction details based on user role.
// - Allows builders to match payments for unpaid bookings.

import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'

// Interfaces for the data structures used
interface Booking {
  id: number
  unit_id: number          // internal unit ID
  buyer_name: string
  amount: number
  date: string
}

interface Tx {
  id: number
  booking_id: number | null
  unit_id: number
  amount: number
}

interface Unit {
  id: number
  number: string           // public unit code
  floor: number
  area: number
  price: number
  builder_name: string
}

// Determine API prefix based on user role for project endpoints
function getPrefix(role: string) {
  if (role === 'admin')   return '/admin/projects'
  if (role === 'builder') return '/builder/projects'
  return '/buyer/projects'
}

export default function UnitDetail() {
  const router = useRouter()
  const { projectId, unitId } = router.query as {
    projectId?: string
    unitId?:    string
  }
  const { user } = useAuth()

  const prefix = getPrefix(user?.role ?? '')

  // Local state for unit, booking, transactions, and status
  const [unit,    setUnit]   = useState<Unit   | null>(null)
  const [booking,setBooking] = useState<Booking| null>(null)
  const [txs,     setTxs]    = useState<Tx     []>([])
  const [status,  setStatus] = useState<'Available'|'Unpaid'|'Paid'>('Available')

  useEffect(() => {
    // Wait until query params and user.role are available
    if (!projectId || !unitId) return

    // 1) Fetch all units for this project and find the specific unit by ID
    api.get(`${prefix}/${projectId}/units`)
      .then(res => {
        const found = (res.data.units as Unit[])
          .find(u => u.id === Number(unitId))
        setUnit(found || null)
      })
      .catch(console.error)

    // 2) Fetch bookings; admin sees all, others see only own bookings
    const bookingsEndpoint = user?.role === 'admin'
      ? '/admin/bookings'
      : '/buyer/bookings'

    api.get(bookingsEndpoint)
      .then(res => {
        const b = (res.data.bookings as Booking[]).find(
          b => b.unit_id === Number(unitId)
        )
        setBooking(b || null)
      })
      .catch(() => setBooking(null))

    // 3) Fetch transactions; admin sees all, builders see their own
    const txEndpoint = user?.role === 'admin'
      ? '/admin/transactions'
      : '/builder/transactions'

    api.get(txEndpoint)
      .then(res => setTxs(res.data.transactions as Tx[]))
      .catch(console.error)
  }, [projectId, unitId, user?.role, prefix])

  // 4) Determine status based on booking and matching
  useEffect(() => {
    if (!booking) {
      setStatus('Available')
    } else {
      const paid = txs.some(t => t.booking_id === booking.id)
      setStatus(paid ? 'Paid' : 'Unpaid')
    }
  }, [booking, txs])

  // Show loading text until unit data is retrieved
  if (!unit) return <p>Loading…</p>

  return (
    <ProtectedRoute roles={['admin','builder','buyer']}>
      <div className="space-y-6 p-6">
        {/* Unit header with dynamic status indicator */}
        <h1 className="text-2xl font-bold">
          Unit {unit.number}{' '}
          <span className={
            status === 'Available'
              ? 'text-green-600'
              : status === 'Paid'
              ? 'text-blue-600'
              : 'text-yellow-700'
          }>
            ({status})
          </span>
        </h1>

        {/* Unit details section */}
        <div className="space-y-1">
          <p><strong>Floor:</strong> {unit.floor}</p>
          <p><strong>Area:</strong> {unit.area} sqft</p>
          <p><strong>Price:</strong> ${unit.price}</p>
          <p><strong>Builder:</strong> {unit.builder_name}</p>
        </div>

        {/* Booking details, shown if a booking exists */}
        {booking && (
          <div className="bg-green-50 p-4 rounded space-y-1">
            <h2 className="font-semibold">Booking Details</h2>
            <p><strong>ID:</strong> {booking.id}</p>
            <p><strong>Buyer:</strong> {booking.buyer_name}</p>
            <p><strong>Amount:</strong> ${booking.amount}</p>
            <p><strong>Date:</strong> {booking.date}</p>
          </div>
        )}

        {/* If user is a builder and booking is unpaid, show match form */}
        {user?.role === 'builder' && booking && status === 'Unpaid' && (
          <MatchForm bookingId={booking.id} />
        )}
      </div>
    </ProtectedRoute>
  )
}

// MatchForm component allows builder to enter a transaction ID to match payment
function MatchForm({ bookingId }: { bookingId: number }) {
  const [txId, setTxId]       = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleMatch = () => {
    if (!txId) return alert('Enter a transaction ID')
    setLoading(true)
    api.post('/builder/transactions/match', {
      transaction_id: Number(txId),
      booking_id: bookingId,
    })
      .then(() => window.location.reload())
      .catch(err => alert(err.response?.data?.message || 'Match failed'))
      .finally(() => setLoading(false))
  }

  return (
    <div className="space-y-2 p-4 bg-yellow-50 rounded">
      <h3 className="font-semibold">Match Payment</h3>
      <input
        type="number"
        placeholder="Transaction ID"
        value={txId}
        onChange={e => setTxId(e.target.value)}
        className="border rounded px-2 py-1 mr-2"
      />
      <button
        onClick={handleMatch}
        disabled={loading}
        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Matching…' : 'Match'}
      </button>
    </div>
  )
}