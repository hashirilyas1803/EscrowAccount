import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode;
  roles: string[];
}) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === null) router.replace('/login');
    else if (!roles.includes(user.role)) router.replace('/unauthorized');
  }, [user, router]);

  if (!user || !roles.includes(user.role)) return null;
  return <>{children}</>;
}
