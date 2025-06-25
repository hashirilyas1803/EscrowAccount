import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

const Navbar = () => {
  const { isLoggedIn, user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      if (user?.role === 'buyer') {
        await api.post('/buyer/auth/logout');
      } else {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      logout();
      router.push('/login');
    }
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href={isLoggedIn ? "/dashboard" : "/"} legacyBehavior>
              <a className="text-2xl font-bold text-indigo-600">EscrowBank</a>
            </Link>
          </div>
          <div className="flex items-center">
            {isLoggedIn ? (
              <>
                <span className="text-gray-700 mr-4">
                  Welcome, <span className="font-semibold">{user?.role}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="space-x-4">
                 <Link href="/login" legacyBehavior>
                    <a className="text-gray-700 hover:text-indigo-600">Login</a>
                </Link>
                <Link href="/register" legacyBehavior>
                    <a className="text-gray-700 hover:text-indigo-600">Register</a>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;