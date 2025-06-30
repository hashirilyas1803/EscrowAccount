import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import BuilderDashboard from '@/components/dashboards/BuilderDashboard';
import BuyerDashboard   from '@/components/dashboards/BuyerDashboard';
import AdminDashboard   from '@/components/dashboards/AdminDashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }

  let DashboardComponent = BuilderDashboard;
  if (user.role === 'admin') DashboardComponent = AdminDashboard;
  else if (user.role === 'buyer') DashboardComponent = BuyerDashboard;

  return (
    <ProtectedRoute roles={['admin','builder','buyer']}>
      <DashboardComponent />
    </ProtectedRoute>
  );
}