import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          EscrowBank
        </Link>

        <div className="space-x-4">
          {user ? (
            <>
              <span className="capitalize">{user.role}</span>
              <button
                onClick={logout}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="px-3 py-1 hover:underline">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
