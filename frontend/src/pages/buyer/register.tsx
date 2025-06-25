import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function BuyerRegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        emirates_id: '',
        phone_number: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const router = useRouter();
    const { login } = useAuth();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const response = await api.post('/buyer/auth/register', formData);
            if (response.data.status === 'success') {
                login(response.data, 'buyer');
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed.');
        }
    };

    return (
         <div className="flex flex-col items-center justify-center">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center mb-6">Register as Buyer</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <form onSubmit={handleRegister}>
                    <div className="mb-4">
                        <label className="block text-gray-700">Full Name</label>
                        <input type="text" name="name" onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                     <div className="mb-4">
                        <label className="block text-gray-700">Email</label>
                        <input type="email" name="email" onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                     <div className="mb-4">
                        <label className="block text-gray-700">Phone Number</label>
                        <input type="tel" name="phone_number" onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                     <div className="mb-4">
                        <label className="block text-gray-700">Emirates ID (15 digits)</label>
                        <input type="text" name="emirates_id" onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                     <div className="mb-6">
                        <label className="block text-gray-700">Password</label>
                        <input type="password" name="password" onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                        Register
                    </button>
                </form>
                <div className="mt-6 text-center">
                    <p>Already a buyer? <Link href="/buyer/login" legacyBehavior><a className="text-indigo-600 hover:underline">Login here</a></Link></p>
                </div>
            </div>
        </div>
    );
}