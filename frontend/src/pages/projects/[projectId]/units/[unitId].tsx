import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'

interface Booking {
  id: number
  unit_id: number
  buyer_name: string
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
  builder_name: string
}

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

  const [unit,    setUnit]    = useState<Unit   | null>(null)
  const [booking,setBooking]  = useState<Booking| null>(null)
  const [txs,     setTxs]     = useState<Tx     []>([])
  const [status,  setStatus]  = useState<'Available'|'Unpaid'|'Paid'>('Available')

  useEffect(() => {
    if (!projectId || !unitId) return

    // 1) load this unit
    api.get(`${prefix}/${projectId}/units`)
      .then(res => {
        const found = (res.data.units as Unit[])
          .find(u => u.id === Number(unitId))
        setUnit(found || null)
      })
      .catch(console.error)

    // 2) load bookings (admin sees all, others see own)
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

    // 3) load transactions (admin sees all, builder sees own)
    const txEndpoint = user?.role === 'admin'
      ? '/admin/transactions'
      : '/builder/transactions'

    api.get(txEndpoint)
      .then(res => setTxs(res.data.transactions as Tx[]))
      .catch(console.error)
  }, [projectId, unitId, user?.role, prefix])

  // 4) recompute status when booking or txs change
  useEffect(() => {
    if (!booking) {
      setStatus('Available')
    } else {
      const paid = txs.some(t => t.booking_id === booking.id)
      setStatus(paid ? 'Paid' : 'Unpaid')
    }
  }, [booking, txs])

  if (!unit) return <p>Loading…</p>

  return (
    <ProtectedRoute roles={['admin','builder','buyer']}>
      <div className="space-y-6 p-6">
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

        <div className="space-y-1">
          <p><strong>Floor:</strong> {unit.floor}</p>
          <p><strong>Area:</strong> {unit.area} sqft</p>
          <p><strong>Price:</strong> ${unit.price}</p>
          <p>
            <strong>Builder:</strong>{' '}
            {unit.builder_name}
          </p>
        </div>

        {booking && (
          <div className="bg-green-50 p-4 rounded space-y-1">
            <h2 className="font-semibold">Booking Details</h2>
            <p><strong>ID:</strong> {booking.id}</p>
            <p><strong>Buyer:</strong> {booking.buyer_name}</p>
            <p><strong>Amount:</strong> ${booking.amount}</p>
            <p><strong>Method:</strong> {booking.method}</p>
            <p><strong>Date:</strong> {booking.date}</p>
          </div>
        )}

        {/* Builder-only match button */}
        {user?.role === 'builder' && booking && status === 'Unpaid' && (
          <MatchForm bookingId={booking.id} />
        )}
      </div>
    </ProtectedRoute>
  )
}

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