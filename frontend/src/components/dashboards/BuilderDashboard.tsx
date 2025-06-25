// File: frontend/src/components/dashboards/BuilderDashboard.tsx
// (This is the complete version from my previous answer that removes all placeholders)
import { useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

// --- Type Definitions for our data ---
interface Project {
  id: number;
  name: string;
  location: string;
  num_units: number;
}
interface Transaction {
    id: number;
    amount: number;
    date: string;
    payment_method: string;
    booking_id_val: number | null;
}
interface Booking {
    id: number;
    unit_code: string;
    buyer_name: string;
}

// --- A generic Modal Component ---
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: ReactNode }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">×</button>
                </div>
                {children}
            </div>
        </div>
    );
};


// --- The Main Dashboard Component ---
const BuilderDashboard = () => {
    // --- State Variables ---
    const [metrics, setMetrics] = useState<any>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    
    // State for modals
    const [isProjectModalOpen, setProjectModalOpen] = useState(false);
    const [isUnitModalOpen, setUnitModalOpen] = useState(false);
    const [isMatchModalOpen, setMatchModalOpen] = useState(false);

    // State for forms
    const [newProjectData, setNewProjectData] = useState({ name: '', location: '', num_units: 0 });
    const [newUnitData, setNewUnitData] = useState({ unit_id: '', floor: 0, area: 0, price: 0 });
    
    // State to track selected items for modals
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [selectedBookingId, setSelectedBookingId] = useState<string>('');


    // --- Data Fetching ---
    const fetchBuilderData = async () => {
        try {
            const [metricsRes, projectsRes, transactionsRes, bookingsRes] = await Promise.all([
                api.get('/builder/dashboard'),
                api.get('/builder/projects'),
                api.get('/builder/transactions'),
                api.get('/builder/bookings')
            ]);
            setMetrics(metricsRes.data);
            setProjects(projectsRes.data.projects);
            setTransactions(transactionsRes.data.transactions);
            setBookings(bookingsRes.data.bookings);
        } catch (error) {
            console.error("Failed to fetch builder data", error);
        }
    };

    useEffect(() => {
        fetchBuilderData();
    }, []);

    // --- Event Handlers ---
    const handleAddProject = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/builder/projects', newProjectData);
            setProjectModalOpen(false);
            fetchBuilderData(); // Refresh data
        } catch (error) {
            alert("Failed to add project.");
        }
    };

    const handleAddUnit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProjectId) return;
        try {
            await api.post(`/builder/projects/${selectedProjectId}/units`, newUnitData);
            setUnitModalOpen(false);
            fetchBuilderData(); // Refresh data
        } catch (error) {
            alert("Failed to add unit.");
        }
    };
    
    const handleMatchTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTransaction || !selectedBookingId) return;
        try {
            await api.post('/builder/transactions/match', {
                transaction_id: selectedTransaction.id,
                booking_id: parseInt(selectedBookingId)
            });
            setMatchModalOpen(false);
            fetchBuilderData(); // Refresh data
        } catch (error) {
            alert("Failed to match transaction.");
        }
    };

    const openUnitModal = (projectId: number) => {
        setSelectedProjectId(projectId);
        setUnitModalOpen(true);
    };

    const openMatchModal = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setMatchModalOpen(true);
    };

    const unmatchedTransactions = transactions.filter(tx => !tx.booking_id_val);

    return (
        <div className="space-y-8">
            {/* METRICS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow text-center"><p className="text-gray-600 text-sm">Total Projects</p><p className="text-3xl font-bold">{metrics?.total_projects || 0}</p></div>
                <div className="bg-white p-6 rounded-lg shadow text-center"><p className="text-gray-600 text-sm">Total Units</p><p className="text-3xl font-bold">{metrics?.total_units || 0}</p></div>
                <div className="bg-white p-6 rounded-lg shadow text-center"><p className="text-gray-600 text-sm">Units Booked</p><p className="text-3xl font-bold">{metrics?.units_booked || 0}</p></div>
                <div className="bg-white p-6 rounded-lg shadow text-center"><p className="text-gray-600 text-sm">Total Booking Amount</p><p className="text-3xl font-bold">${(metrics?.total_booking_amount || 0).toLocaleString()}</p></div>
            </div>

            {/* MY PROJECTS SECTION */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-semibold">My Projects</h3>
                    <button onClick={() => setProjectModalOpen(true)} className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700">+ Add Project</button>
                </div>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {projects.length > 0 ? (
                        <ul className="divide-y divide-gray-200">{projects.map((p) => (<li key={p.id} className="p-4 flex justify-between items-center"><div><p className="font-semibold text-lg">{p.name}</p><p className="text-sm text-gray-600">{p.location} - {p.num_units} units</p></div><button onClick={() => openUnitModal(p.id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">Add Unit</button></li>))}</ul>
                    ) : (<p className="p-4 text-gray-500">You have not created any projects yet.</p>)}
                </div>
            </div>

            {/* UNMATCHED TRANSACTIONS SECTION */}
             <div>
                <h3 className="text-2xl font-semibold mb-4">Unmatched Transactions</h3>
                 <div className="bg-white p-4 rounded-lg shadow">
                    {unmatchedTransactions.length > 0 ? (
                         <table className="w-full text-left">
                            <thead><tr className="border-b"><th className="p-2">Date</th><th className="p-2">Amount</th><th className="p-2">Payment Method</th><th className="p-2">Action</th></tr></thead>
                            <tbody>{unmatchedTransactions.map(tx => (<tr key={tx.id} className="border-b"><td className="p-2">{new Date(tx.date).toLocaleDateString()}</td><td className="p-2">${tx.amount.toLocaleString()}</td><td className="p-2 capitalize">{tx.payment_method}</td><td className="p-2"><button onClick={() => openMatchModal(tx)} className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">Match</button></td></tr>))}</tbody>
                        </table>
                    ) : <p className="p-4 text-gray-500">No unmatched transactions found.</p>}
                </div>
            </div>

            {/* MODALS */}
            <Modal isOpen={isProjectModalOpen} onClose={() => setProjectModalOpen(false)} title="Add New Project">
                <form onSubmit={handleAddProject}>
                    <div className="mb-4"><label>Project Name</label><input type="text" onChange={e => setNewProjectData({...newProjectData, name: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded" required /></div>
                    <div className="mb-4"><label>Location</label><input type="text" onChange={e => setNewProjectData({...newProjectData, location: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded" required /></div>
                    <div className="mb-4"><label>Number of Units</label><input type="number" onChange={e => setNewProjectData({...newProjectData, num_units: parseInt(e.target.value)})} className="w-full mt-1 px-3 py-2 border rounded" required /></div>
                    <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">Create Project</button>
                </form>
            </Modal>

            <Modal isOpen={isUnitModalOpen} onClose={() => setUnitModalOpen(false)} title="Add New Unit">
                 <form onSubmit={handleAddUnit}>
                    <div className="mb-4"><label>Unit ID (e.g., A101)</label><input type="text" onChange={e => setNewUnitData({...newUnitData, unit_id: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded" required /></div>
                    <div className="mb-4"><label>Floor</label><input type="number" onChange={e => setNewUnitData({...newUnitData, floor: parseInt(e.target.value)})} className="w-full mt-1 px-3 py-2 border rounded" required /></div>
                    <div className="mb-4"><label>Area (sq ft)</label><input type="number" onChange={e => setNewUnitData({...newUnitData, area: parseFloat(e.target.value)})} className="w-full mt-1 px-3 py-2 border rounded" required /></div>
                    <div className="mb-4"><label>Price</label><input type="number" onChange={e => setNewUnitData({...newUnitData, price: parseFloat(e.target.value)})} className="w-full mt-1 px-3 py-2 border rounded" required /></div>
                    <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">Add Unit</button>
                </form>
            </Modal>

            <Modal isOpen={isMatchModalOpen} onClose={() => setMatchModalOpen(false)} title="Match Transaction">
                 <form onSubmit={handleMatchTransaction}>
                    <div className="mb-4 bg-gray-100 p-3 rounded">
                        <p><strong>Transaction ID:</strong> {selectedTransaction?.id}</p>
                        <p><strong>Amount:</strong> ${selectedTransaction?.amount.toLocaleString()}</p>
                    </div>
                    <div className="mb-4">
                        <label>Select Booking to Match</label>
                        <select value={selectedBookingId} onChange={e => setSelectedBookingId(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded bg-white" required>
                            <option value="" disabled>-- Please select a booking --</option>
                            {bookings.map(b => (
                                <option key={b.id} value={b.id.toString()}>Booking for {b.buyer_name} (Unit: {b.unit_code})</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Match Transaction</button>
                </form>
            </Modal>
        </div>
    );
};

export default BuilderDashboard;