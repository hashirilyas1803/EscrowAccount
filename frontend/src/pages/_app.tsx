// _app.tsx
// Custom App component to initialize pages with global providers and layout.
// - Imports global CSS.
// - Wraps the entire application with AuthProvider for authentication context.
// - Renders a site-wide Navbar and main content container.

import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { AuthProvider } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'

export default function App({ Component, pageProps }: AppProps) {
  return (
    // Provide authentication context to all pages
    <AuthProvider>
      {/* Persistent navigation bar across all pages */}
      <Navbar />
      {/* Main content area with max-width and padding */}
      <main className="max-w-7xl mx-auto p-4">
        {/* Render the active page component */}
        <Component {...pageProps} />
      </main>
    </AuthProvider>
  )
}