import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

import AdminDashboard from '@/components/dashboards/AdminDashboard';
import BuilderDashboard from '@/components/dashboards/BuilderDashboard';
import BuyerDashboard from '@/components/dashboards/BuyerDashboard';

const Dashboard = () => {
    const { user } = useAuth();

    const renderDashboard = () => {
        switch (user?.role) { // <-- FIX is here: used optional chaining
            case 'admin':
                return <AdminDashboard />;
            case 'builder':
                return <BuilderDashboard />;
            case 'buyer':
                return <BuyerDashboard />;
            default:
                // This will show briefly while the user is being loaded
                return <div>Loading dashboard...</div>;
        }
    };

    return (
        <ProtectedRoute allowedRoles={['admin', 'builder', 'buyer']}>
            <div>
                {/* FIX is here: Safely access user properties */}
                <h1 className="text-3xl font-bold mb-6">
                    {user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)} Dashboard` : 'Dashboard'}
                </h1>
                {renderDashboard()}
            </div>
        </ProtectedRoute>
    );
};

export default Dashboard;