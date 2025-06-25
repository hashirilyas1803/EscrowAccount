import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: Array<'builder' | 'admin' | 'buyer'>;
}

/**
 * A component that wraps pages to protect them based on user authentication and roles.
 * Redirects unauthenticated or unauthorized users.
 */
const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is not logged in, redirect to the main login page.
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    // If user is logged in but their role is not in the allowed list, redirect.
    if (user && !allowedRoles.includes(user.role!)) {
      router.push('/unauthorized');
    }
  }, [isLoggedIn, user, router, allowedRoles]);

  // Render a loading state while checks are being performed.
  if (!isLoggedIn || (user && !allowedRoles.includes(user.role!))) {
    return <div className="text-center p-10">Loading...</div>;
  }

  // If checks pass, render the child components.
  return <>{children}</>;
};

export default ProtectedRoute;