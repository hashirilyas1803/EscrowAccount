// NewUnitBatchPage.tsx
import React, { useState } from 'react'
import { useRouter } from 'next/router'
import ProtectedRoute from '@/components/ProtectedRoute'
import api from '@/lib/api'

export default function NewUnitBatchPage() {
  const router = useRouter()
  const { projectId } = router.query as { projectId?: string }

  const [prefix, setPrefix]           = useState('')
  const [unitsPerFloor, setUnitsPerFloor] = useState<number | ''>('')
  const [numFloors, setNumFloors]     = useState<number | ''>('')
  const [area, setArea]               = useState<number | ''>('')
  const [price, setPrice]             = useState<number | ''>('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (
      !prefix ||
      unitsPerFloor === '' ||
      numFloors === '' ||
      area === '' ||
      price === ''
    ) {
      setError('All fields are required')
      return
    }

    setLoading(true)
    try {
      await api.post(`/builder/projects/${projectId}/units/batch`, {
        prefix,
        units_per_floor: Number(unitsPerFloor),
        num_floors: Number(numFloors),
        area: Number(area),
        price: Number(price),
      })
      router.back()
    } catch (e: any) {
      const errorMsg = e.response?.data?.message || 'Failed to create units'
      router.push(`/projects/${projectId}?error=${encodeURIComponent(errorMsg)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute roles={['builder']}>
      <form
        onSubmit={submit}
        className="w-1/2 mx-auto p-4 rounded shadow flex flex-col gap-4 my-card"
      >
        <h1 className="text-2xl font-bold">Add New Unit Batch</h1>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {/* Batch Prefix */}
        <div>
          <input
            id="prefix"
            type="text"
            placeholder="Unit Prefix (e.g. A)"
            value={prefix}
            onChange={e => setPrefix(e.target.value)}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        {/* Units Per Floor */}
        <div>
          <input
            id="unitsPerFloor"
            type="number"
            placeholder="Units Per Floor"
            value={unitsPerFloor}
            onChange={e =>
              setUnitsPerFloor(
                e.target.value === '' ? '' : Number(e.target.value)
              )
            }
            min={1}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        {/* Number of Floors */}
        <div>
          <input
            id="numFloors"
            type="number"
            placeholder="Number of Floors"
            value={numFloors}
            onChange={e =>
              setNumFloors(e.target.value === '' ? '' : Number(e.target.value))
            }
            min={1}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        {/* Area */}
        <div>
          <input
            id="area"
            type="number"
            placeholder="Area (sq ft)"
            value={area}
            onChange={e =>
              setArea(e.target.value === '' ? '' : Number(e.target.value))
            }
            min={0}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        {/* Price */}
        <div>
          <input
            id="price"
            type="number"
            placeholder="Price ($)"
            value={price}
            onChange={e =>
              setPrice(e.target.value === '' ? '' : Number(e.target.value))
            }
            min={0}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded disabled:opacity-50 btn btn-custom"
        >
          {loading ? 'Creating…' : 'Create Units'}
        </button>
      </form>
    </ProtectedRoute>
  )
}