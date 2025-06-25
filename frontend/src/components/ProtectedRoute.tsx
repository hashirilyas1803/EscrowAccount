import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: Array<'builder' | 'admin' | 'buyer'>;
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    if (user && !allowedRoles.includes(user.role!)) {
      router.push('/unauthorized'); // Or a generic dashboard
    }
  }, [isLoggedIn, user, router, allowedRoles]);

  if (!isLoggedIn || (user && !allowedRoles.includes(user.role!))) {
    // Optionally return a loading spinner
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;