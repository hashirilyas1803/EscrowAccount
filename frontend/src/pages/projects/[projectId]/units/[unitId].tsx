// src/pages/projects/[projectId]/units/[unitId].tsx
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'

interface Booking {
  id: number
  unit_id: number
  buyerName: string
  amount: number
  method: string
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
  number: string
  floor: number
  area: number
  price: number
}

export default function UnitDetail() {
  const router = useRouter()
  const { projectId, unitId } = router.query as {
    projectId?: string
    unitId?: string
  }
  const { user } = useAuth()

  const [unit, setUnit]           = useState<Unit | null>(null)
  const [booking, setBooking]     = useState<Booking | null>(null)
  const [txs, setTxs]             = useState<Tx[]>([])
  const [status, setStatus]       = useState<'Available'|'Unpaid'|'Paid'>('Available')

  useEffect(() => {
    if (!projectId || !unitId) return

    // 1) load this unit
    api.get(`/builder/projects/${projectId}/units`)
      .then(res => {
        const found = (res.data.units as Unit[]).find(u => u.id === Number(unitId))
        setUnit(found || null)
      })
      .catch(console.error)

    // 2) load buyer’s bookings, filter by this unit_id
    api.get('/buyer/bookings')
      .then(res => {
        const b = (res.data.bookings as Booking[]).find(
          (b) => b.unit_id === Number(unitId)
        )
        setBooking(b || null)
      })
      .catch(() => setBooking(null))

    // 3) load builder’s transactions once
    api.get('/builder/transactions')
      .then(res => setTxs(res.data.transactions as Tx[]))
      .catch(console.error)
  }, [projectId, unitId])

  // 4) whenever booking or txs change, recompute status
  useEffect(() => {
    if (!booking) {
      setStatus('Available')
    } else {
      // look for a transaction that has booking_id === booking.id
      const paid = txs.some(t => t.booking_id === booking.id)
      setStatus(paid ? 'Paid' : 'Unpaid')
    }
  }, [booking, txs])

  if (!unit) return <p>Loading…</p>

  return (
    <ProtectedRoute roles={['builder','buyer','admin']}>
      <div className="space-y-6">
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

        <p>Floor: {unit.floor}</p>
        <p>Area: {unit.area} sqft</p>
        <p>Price: ${unit.price}</p>

        <p>
          <strong>Builder:</strong>{' '}
          {user?.role === 'builder'
            ? user.name
            : '—'}
        </p>

        {booking && (
          <div className="bg-green-50 p-4 rounded space-y-1">
            <h2 className="font-semibold">Booking Details</h2>
            <p><strong>ID:</strong> {booking.id}</p>
            <p><strong>Buyer:</strong> {booking.buyerName}</p>
            <p><strong>Amount:</strong> ${booking.amount}</p>
            <p><strong>Method:</strong> {booking.method}</p>
            <p><strong>Date:</strong> {booking.date}</p>
          </div>
        )}

        {/* Builder-only match button */}
        {user?.role === 'builder' && booking && status === 'Unpaid' && (
          <MatchForm bookingId={booking.id} unitId={unit.id} />
        )}
      </div>
    </ProtectedRoute>
  )
}

// extracted match form
function MatchForm({ bookingId, unitId }: { bookingId: number; unitId: number }) {
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
      .catch(err => alert(err.response?.data?.message||'Match failed'))
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