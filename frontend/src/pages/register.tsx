import { useState } from 'react';
import { useRouter } from 'next/router';
import api from '@/lib/api';

type Role = 'builder' | 'buyer';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('builder');

  // Shared
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string|null>(null);
  const [name, setName] = useState('');

  // Buyer-only
  const [emirates_id, setEmiratesId] = useState('');
  const [phone_number, setPhoneNumber] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (role === 'buyer') {
        await api.post('/buyer/auth/register', {
          name,
          emirates_id,
          phone_number,
          email,
          password,
        });
      } else {
        await api.post('/auth/register', {
          name,
          email,
          password,
          role,
        });
      }
      router.push('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-semibold text-center">Register</h2>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div>
          <label className="block text-sm">Role</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value as Role)}
            className="mt-1 block w-full border rounded p-2"
          >
            <option value="builder">Builder</option>
            <option value="buyer">Buyer</option>
          </select>
        </div>

        {role === 'builder' ? (
          <div>
            <label className="block text-sm">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
        ) : (
          <>
            <label className="block text-sm">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="mt-1 block w-full border rounded p-2"
            />
            <label className="block text-sm">Emirates ID</label>
            <input
              type="text"
              value={emirates_id}
              onChange={e => setEmiratesId(e.target.value)}
              required
              className="mt-1 block w-full border rounded p-2"
            />
            <label className="block text-sm">Phone Number</label>
            <input
              type="text"
              value={phone_number}
              onChange={e => setPhoneNumber(e.target.value)}
              required
              className="mt-1 block w-full border rounded p-2"
            />
          </>
        )}

        <label className="block text-sm">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="mt-1 block w-full border rounded p-2"
        />

        <label className="block text-sm">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="mt-1 block w-full border rounded p-2"
        />

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
        >
          Create Account
        </button>
      </form>
    </div>
  );
}