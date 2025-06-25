import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'builder' | 'admin'>('builder');
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      if (response.data.status === 'success') {
        login(response.data, 'user');
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center mb-6">Register as Builder or Admin</h2>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <form onSubmit={handleRegister}>
                <div className="mb-4">
                    <label className="block text-gray-700">Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
                </div>
                 <div className="mb-4">
                    <label className="block text-gray-700">Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
                </div>
                 <div className="mb-6">
                    <label className="block text-gray-700">Role</label>
                    <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg">
                        <option value="builder">Builder</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">
                    Register
                </button>
            </form>
             <div className="mt-6 text-center">
                <p>Are you a buyer? <Link href="/buyer/register" legacyBehavior><a className="text-indigo-600 hover:underline">Register here</a></Link></p>
                <p>Already have an account? <Link href="/login" legacyBehavior><a className="text-indigo-600 hover:underline">Login</a></Link></p>
            </div>
        </div>
    </div>
  );
}