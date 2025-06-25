import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.status === 'success') {
        login(response.data, 'user');
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Builder / Admin Login</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleLogin}>
          {/* Form fields */}
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">
            Login
          </button>
        </form>
        <div className="mt-6 text-center">
            <p>Are you a buyer? <Link href="/buyer/login" legacyBehavior><a className="text-indigo-600 hover:underline">Login here</a></Link></p>
            <p>Don't have an account? <Link href="/register" legacyBehavior><a className="text-indigo-600 hover:underline">Register</a></Link></p>
        </div>
      </div>
    </div>
  );
}