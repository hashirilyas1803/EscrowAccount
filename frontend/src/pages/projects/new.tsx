// src/pages/projects/new.tsx

import { useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loc, setLoc] = useState('');
  const [units, setUnits] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !loc.trim() || units === '' || units < 1) {
      setError('All fields are required and number of units must be ≥ 1');
      return;
    }
    setLoading(true);
    try {
      await api.post('/builder/projects', {
        name: name.trim(),
        location: loc.trim(),
        num_units: units,
      });
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute roles={['builder']}>
      <form
        onSubmit={submit}
        className="max-w-md mx-auto p-6 bg-white rounded shadow space-y-6"
      >
        <h1 className="text-2xl font-bold">Create New Project</h1>

        {error && (
          <p className="text-red-600 text-sm">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="projectName" className="block text-sm font-medium">
            Project Name
          </label>
          <input
            id="projectName"
            type="text"
            placeholder="e.g. Riverside Apartments"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        <div>
          <label htmlFor="projectLoc" className="block text-sm font-medium">
            Location
          </label>
          <input
            id="projectLoc"
            type="text"
            placeholder="e.g. Downtown, Dubai"
            value={loc}
            onChange={e => setLoc(e.target.value)}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        <div>
          <label htmlFor="projectUnits" className="block text-sm font-medium">
            Number of Units
          </label>
          <input
            id="projectUnits"
            type="number"
            placeholder="e.g. 20"
            value={units}
            onChange={e => {
              const v = e.target.value;
              setUnits(v === '' ? '' : Math.max(1, Number(v)));
            }}
            onFocus={e => (e.target as HTMLInputElement).select()}
            min={1}
            required
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create Project'}
        </button>
      </form>
    </ProtectedRoute>
  );
}