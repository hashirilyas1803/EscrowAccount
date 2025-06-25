import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

// Import the role-specific dashboard components.
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import BuilderDashboard from '@/components/dashboards/BuilderDashboard';
import BuyerDashboard from '@/components/dashboards/BuyerDashboard';

/**
 * A top-level component that acts as a router to display the correct
 * dashboard based on the logged-in user's role.
 */
const Dashboard = () => {
    const { user } = useAuth();

    // Conditionally renders the correct dashboard component.
    const renderDashboard = () => {
        switch (user?.role) {
            case 'admin':
                return <AdminDashboard />;
            case 'builder':
                return <BuilderDashboard />;
            case 'buyer':
                return <BuyerDashboard />;
            default:
                // This shows a loading state while user data is being fetched.
                return <div>Loading dashboard...</div>;
        }
    };

    return (
        // Protect this route, only allowing logged-in users.
        <ProtectedRoute allowedRoles={['admin', 'builder', 'buyer']}>
            <div>
                <h1 className="text-3xl font-bold mb-6 capitalize">
                    {user?.role ? `${user.role} Dashboard` : 'Dashboard'}
                </h1>
                {renderDashboard()}
            </div>
        </ProtectedRoute>
    );
};

export default Dashboard;