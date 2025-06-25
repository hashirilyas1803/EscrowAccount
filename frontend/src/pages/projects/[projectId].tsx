import { useRouter } from 'next/router';
import { useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

// Type definitions for the data this page handles.
interface Unit {
    id: number;
    unit_id: string;
    floor: number;
    area: number;
    price: number;
}
interface Project {
    id: number;
    name: string;
    location: string;
}

// A simple modal component for the booking form.
const Modal = ({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: ReactNode }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                {children}
            </div>
        </div>
    );
};

/**
 * A dynamic page that displays details for a single project,
 * including its list of units available for booking.
 */
const ProjectDetailPage = () => {
    const router = useRouter();
    const { user } = useAuth();
    const { projectId } = router.query;
    
    const [project, setProject] = useState<Project | null>(null);
    const [units, setUnits] = useState<Unit[]>([]);
    const [isBookingModalOpen, setBookingModalOpen] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [bookingAmount, setBookingAmount] = useState('');
    
    // Fetches project and unit data when the projectId is available.
    useEffect(() => {
        if (projectId) {
            api.get(`/builder/projects/${projectId}`).then(res => setProject(res.data.project));
            api.get(`/builder/projects/${projectId}/units`).then(res => setUnits(res.data.units));
        }
    }, [projectId]);

    const openBookingModal = (unit: Unit) => {
        setSelectedUnit(unit);
        setBookingAmount(unit.price.toString()); // Pre-fill amount
        setBookingModalOpen(true);
    };

    const handleBookingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUnit) return;
        
        try {
            await api.post('/buyer/bookings', {
                unit_id: selectedUnit.unit_id,
                booking_amount: parseFloat(bookingAmount),
                booking_date: new Date().toISOString().split('T')[0] // Today's date
            });
            alert(`Successfully booked unit ${selectedUnit.unit_id}!`);
            setBookingModalOpen(false);
            // In a real app, you might want to refresh the unit list to show it's booked.
        } catch (error: any) {
            alert(`Booking failed: ${error.response?.data?.message || 'Server error'}`);
        }
    };


    if (!project) return <div className="text-center p-10">Loading project details...</div>;

    return (
        <ProtectedRoute allowedRoles={['builder', 'buyer', 'admin']}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">{project.name}</h1>
                    <p className="text-lg text-gray-600">{project.location}</p>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <h2 className="text-xl font-semibold p-4 border-b">Available Units</h2>
                    <ul className="divide-y divide-gray-200">
                        {units.length > 0 ? units.map(unit => (
                            <li key={unit.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                <div>
                                    <p className="font-semibold text-lg">Unit: {unit.unit_id}</p>
                                    <p className="text-sm text-gray-500">Floor {unit.floor}, {unit.area} sq ft</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-green-600">${unit.price.toLocaleString()}</p>
                                     {user?.role === 'buyer' && (
                                        <button onClick={() => openBookingModal(unit)} className="mt-1 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 font-semibold">
                                            Book Now
                                        </button>
                                     )}
                                </div>
                            </li>
                        )) : <p className="p-4 text-gray-500">No units available in this project.</p>}
                    </ul>
                </div>
            </div>
            
            <Modal isOpen={isBookingModalOpen} onClose={() => setBookingModalOpen(false)}>
                <h3 className="text-xl font-semibold mb-4">Book Unit {selectedUnit?.unit_id}</h3>
                 <form onSubmit={handleBookingSubmit}>
                    <div className="mb-4">
                        <label className="block font-semibold">Price</label>
                        <p className="text-lg">${selectedUnit?.price.toLocaleString()}</p>
                    </div>
                    <div className="mb-4">
                        <label className="block font-semibold">Booking Amount</label>
                         <input 
                            type="number"
                            value={bookingAmount}
                            onChange={e => setBookingAmount(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded"
                            required 
                        />
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button type="button" onClick={() => setBookingModalOpen(false)} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700">Confirm Booking</button>
                    </div>
                </form>
            </Modal>
        </ProtectedRoute>
    );
};

export default ProjectDetailPage;