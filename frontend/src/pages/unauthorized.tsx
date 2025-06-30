// unauthorized.tsx
// Page displayed when a user attempts to access a route without the required permissions.
// - Shows a simple 403 Forbidden message.
// - Rendered by ProtectedRoute redirection for unauthorized roles.

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* Prominent error message indicating lack of permissions */}
      <h1 className="text-2xl font-bold text-red-600">
        403 — You don’t have permission to view this page.
      </h1>
    </div>
  );
}