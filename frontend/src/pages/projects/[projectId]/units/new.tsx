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
    } catch (e: any) {
      // Display API error message or a fallback
      setError(e.response?.data?.message || 'Failed to create unit')
    } finally {
      setLoading(false)
    }
  }

  return (
    // Restrict this page to authenticated builders
    <ProtectedRoute roles={['builder']}>
      <form
        onSubmit={submit}
        className="max-w-md mx-auto p-6 bg-white rounded shadow space-y-6"
      >
        <h1 className="text-2xl font-bold">Add New Unit</h1>

        {/* Display validation or API errors */}
        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        {/* Unit Number input */}
        <div>
          <label htmlFor="unitId" className="block text-sm font-medium">
            Unit Number
          </label>
          <input
            id="unitId"
            type="text"
            placeholder="e.g. A-101"
            value={unitId}
            onChange={e => setUnitId(e.target.value)}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        {/* Floor input */}
        <div>
          <label htmlFor="floor" className="block text-sm font-medium">
            Floor
          </label>
          <input
            id="floor"
            type="number"
            placeholder="e.g. 3"
            value={floor}
            onChange={e => setFloor(e.target.value === '' ? '' : Number(e.target.value))}
            onFocus={e => (e.target as HTMLInputElement).select()}
            min={0}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        {/* Area input */}
        <div>
          <label htmlFor="area" className="block text-sm font-medium">
            Area (sq ft)
          </label>
          <input
            id="area"
            type="number"
            placeholder="e.g. 1200"
            value={area}
            onChange={e => setArea(e.target.value === '' ? '' : Number(e.target.value))}
            onFocus={e => (e.target as HTMLInputElement).select()}
            min={0}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        {/* Price input */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium">
            Price ($)
          </label>
          <input
            id="price"
            type="number"
            placeholder="e.g. 350000"
            value={price}
            onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
            onFocus={e => (e.target as HTMLInputElement).select()}
            min={0}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        {/* Submit button with loading state */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create Unit'}
        </button>
      </form>
    </ProtectedRoute>
  )
}