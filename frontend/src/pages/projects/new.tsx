// NewProjectPage.tsx
// Page component for creating a new project (builder-only).
// - Protected route limited to users with the 'builder' role.
// - Captures project details and submits to the backend API.
// - Handles client-side validation, loading state, and error display.

import { useState } from 'react'
import { useRouter } from 'next/router'
import ProtectedRoute from '@/components/ProtectedRoute'
import api from '@/lib/api'

export default function NewProjectPage() {
  const router = useRouter()

  // Form state hooks for project details
  const [name, setName]       = useState('')            // Project name
  const [loc, setLoc]         = useState('')            // Project location
  const [units, setUnits]     = useState<number | ''>('') // Number of units
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)         // Submit button loading state

  // Handle form submission to create a new project
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Basic validation: all text fields must be non-empty and units ≥ 1
    if (!name.trim() || !loc.trim()) {
      setError('All fields are required and number of units must be ≥ 1')
      return
    }

    setLoading(true)
    try {
      // Call the builder projects API endpoint
      await api.post('/builder/projects', {
        name:     name.trim(),
        location: loc.trim(),
        // num_units: units,
      })
      // Redirect to the builder dashboard on success
      router.push('/dashboard')
    } catch (e: any) {
      // Display API error message or fallback
      setError(e.response?.data?.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    // Restrict access to authenticated builders
    <ProtectedRoute roles={['builder']}>
      <form
        onSubmit={submit}
        className="w-1/2 mx-auto p-4 rounded shadow flex flex-col gap-4 my-card"
      >
        <h1 className="text-2xl font-bold">Create New Project</h1>

        {/* Show validation or API errors */}
        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        {/* Project Name Input */}
        <div>
          <input
            id="projectName"
            type="text"
            placeholder="Project Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        {/* Location Input */}
        <div>
          <input
            id="projectLoc"
            type="text"
            placeholder="Location"
            value={loc}
            onChange={e => setLoc(e.target.value)}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        {/* Number of Units Input */}
        {/* <div>
          <input
            id="projectUnits"
            type="number"
            placeholder="Number of Units"
            value={units}
            onChange={e => {
              const v = e.target.value
              // Ensure at least 1 unit and allow clearing
              setUnits(v === '' ? '' : Math.max(1, Number(v)))
            }}
            onFocus={e => (e.target as HTMLInputElement).select()}
            min={1}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div> */}

        {/* Submit button with disabled/loading state */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded btn btn-custom"
        >
          {loading ? 'Creating…' : 'Create Project'}
        </button>
      </form>
    </ProtectedRoute>
  )
}