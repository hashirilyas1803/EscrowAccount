// NewUnitPage.tsx
// Page component for adding a new unit under a specific project (builder-only).
// - Protected route for builder role.
// - Captures form input for unit details and submits to API.
// - Displays validation errors and handles loading state.

import React, { useState } from 'react'
import { useRouter } from 'next/router'
import ProtectedRoute from '@/components/ProtectedRoute'
import api from '@/lib/api'

export default function NewUnitPage() {
  const router = useRouter()
  const { projectId } = router.query as { projectId?: string }

  // Form state hooks for unit details
  const [unitId, setUnitId]   = useState('')
  const [floor, setFloor]     = useState<number | ''>('')
  const [area, setArea]       = useState<number | ''>('')
  const [price, setPrice]     = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // Handle form submission to create a new unit
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Basic client-side validation: all fields required
    if (!unitId || floor === '' || area === '' || price === '') {
      setError('All fields are required')
      return
    }

    setLoading(true)
    try {
      // POST request to backend route for unit creation
      await api.post(`/builder/projects/${projectId}/units`, {
        unit_id: unitId,
        floor,
        area,
        price,
      })
      // On success, navigate back to project units list
      router.back()
    }  catch (e: any) {
      const errorMsg = e.response?.data?.message || 'Failed to create unit'
      router.push(`/projects/${projectId}?error=${encodeURIComponent(errorMsg)}`)
    } finally {
      setLoading(false)
    }
  }

return (
  // Restrict this page to authenticated builders
  <ProtectedRoute roles={['builder']}>
    <form
      onSubmit={submit}
      className="w-1/2 mx-auto p-4 rounded shadow flex flex-col gap-4 my-card"
    >
      <h1 className="text-2xl font-bold">Add New Unit</h1>

      {/* Display validation or API errors */}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Unit Number */}
      <div>
        <input
          id="unitId"
          type="text"
          placeholder="Unit Number"
          value={unitId}
          onChange={e => setUnitId(e.target.value)}
          required
          className="mt-1 block w-full border rounded p-2"
        />
      </div>

      {/* Floor */}
      <div>
        <input
          id="floor"
          type="number"
          placeholder="Floor"
          value={floor}
          onChange={e => setFloor(e.target.value === '' ? '' : Number(e.target.value))}
          onFocus={e => (e.target as HTMLInputElement).select()}
          min={0}
          required
          className="mt-1 block w-full border rounded p-2"
        />
      </div>

      {/* Area */}
      <div>
        <input
          id="area"
          type="number"
          placeholder="Area"
          value={area}
          onChange={e => setArea(e.target.value === '' ? '' : Number(e.target.value))}
          onFocus={e => (e.target as HTMLInputElement).select()}
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
          placeholder="Price"
          value={price}
          onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
          onFocus={e => (e.target as HTMLInputElement).select()}
          min={0}
          required
          className="mt-1 block w-full border rounded p-2"
        />
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 rounded disabled:opacity-50 btn btn-custom"
      >
        {loading ? 'Creating…' : 'Create Unit'}
      </button>
    </form>
  </ProtectedRoute>
)
}