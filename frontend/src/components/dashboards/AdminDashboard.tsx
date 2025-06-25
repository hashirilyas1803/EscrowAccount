import { useState, useEffect } from 'react';
import api from '@/lib/api';

// Define the types for the datar
type Project = {
  id: number;
  name: string;
  location: string;
  num_units: number;
};

type Booking = {
  id: number;
  buyer_name: string;
  unit_number: string;
  amount: number;
  date: string;
};

// A combined type for what the displayData can hold
type DisplayItem = Project & Partial<Booking>;


const AdminDashboard = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [filteredData, setFilteredData] = useState<DisplayItem[] | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('project_name');

    useEffect(() => {
        // Fetch initial data
        api.get('/admin/projects').then(res => setProjects(res.data.projects));
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm) {
            setFilteredData(null);
            return;
        }
        try {
            const response = await api.get(`/admin/filter?${filterType}=${encodeURIComponent(searchTerm)}`);
            const data = response.data.projects || response.data.bookings || [];
            setFilteredData(data);
        } catch (error) {
            console.error("Filter error", error);
            setFilteredData([]);
        }
    };
    
    const displayData = filteredData !== null ? filteredData : projects;

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Admin Oversight</h2>
            
            {/* Search and Filter Form */}
            <form onSubmit={handleSearch} className="mb-6 p-4 bg-white rounded-lg shadow">
                <div className="flex items-center space-x-4">
                    <input 
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search term..."
                        className="flex-grow px-3 py-2 border rounded-lg"
                    />
                    <select 
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="px-3 py-2 border rounded-lg bg-white"
                    >
                        <option value="project_name">Project Name</option>
                        <option value="buyer_name">Buyer Name</option>
                        <option value="unit_id">Unit ID</option>
                    </select>
                    <button type="submit" className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700">
                        Search
                    </button>
                </div>
            </form>

            {/* Display Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(displayData || []).map((item: DisplayItem) => (
                    <div key={item.id} className="bg-white p-6 rounded-lg shadow">
                        {item.location && <h3 className="text-xl font-bold text-indigo-700">{item.name}</h3>}
                        {item.buyer_name && <h3 className="text-xl font-bold text-green-700">Booking for {item.buyer_name}</h3>}
                        
                        {item.location && <p>Location: {item.location}</p>}
                        {item.num_units && <p>Units: {item.num_units}</p>}
                        
                        {item.unit_number && <p>Unit: {item.unit_number}</p>}
                        {item.amount && <p>Amount: ${item.amount.toLocaleString()}</p>}
                        {item.date && <p>Date: {new Date(item.date).toLocaleDateString()}</p>}
                    </div>
                ))}
            </div>
             {displayData?.length === 0 && <p>No results found.</p>}
        </div>
    );
};

export default AdminDashboard;