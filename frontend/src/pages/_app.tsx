import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

/**
 * This is the root component of the Next.js application.
 * - Wraps the entire application with the AuthProvider for global state management.
 * - Renders the Navbar on every page.
 */
export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Component {...pageProps} />
      </main>
    </AuthProvider>
  );
}