import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

/**
 * The main entry point of the site.
 * It redirects logged-in users to their dashboard
 * and unauthenticated visitors to the login page.
 */
export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [user, router]);

  return <div className="text-center p-10">Loading…</div>;
}