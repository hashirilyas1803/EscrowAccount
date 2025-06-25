import { useState, useEffect } from 'react';
import api from '@/lib/api';

// Type definitions for data clarity.
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
type DisplayItem = Project & Partial<Booking>;

/**
 * The main dashboard view for the Admin user, providing an overview
 * and filtering capabilities for all platform data.
 */
const AdminDashboard = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [filteredData, setFilteredData] = useState<DisplayItem[] | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('project_name');
    const [isLoading, setIsLoading] = useState(true);

    // Fetch initial data on component mount.
    useEffect(() => {
        api.get('/admin/projects').then(res => {
            setProjects(res.data.projects);
            setIsLoading(false);
        }).catch(err => {
            console.error("Failed to fetch projects", err);
            setIsLoading(false);
        });
    }, []);

    // Handles the search form submission.
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            setFilteredData(null); // Clear filter if search term is empty
            return;
        }
        try {
            const response = await api.get(`/admin/filter?${filterType}=${encodeURIComponent(searchTerm)}`);
            // The filter endpoint can return 'projects' or 'bookings'
            const data = response.data.projects || response.data.bookings || [];
            setFilteredData(data);
        } catch (error) {
            console.error("Filter error", error);
            setFilteredData([]);
        }
    };
    
    // Determine which data to display: filtered results or all projects.
    const displayData = filteredData !== null ? filteredData : projects;

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Admin Oversight</h2>
            
            <form onSubmit={handleSearch} className="mb-6 p-4 bg-white rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <input 
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search..."
                        className="flex-grow w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <select 
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="project_name">By Project Name</option>
                        <option value="buyer_name">By Buyer Name</option>
                        <option value="unit_id">By Unit ID</option>
                    </select>
                    <button type="submit" className="w-full sm:w-auto bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 font-semibold transition-colors">
                        Search
                    </button>
                </div>
            </form>

            {isLoading ? <p>Loading data...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayData.map((item: DisplayItem) => (
                        <div key={`${item.id}-${item.name || item.buyer_name}`} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                            {/* Project-specific display */}
                            {item.location && <h3 className="text-xl font-bold text-indigo-700">{item.name}</h3>}
                            {/* Booking-specific display */}
                            {item.buyer_name && <h3 className="text-xl font-bold text-green-700">Booking for {item.buyer_name}</h3>}
                            
                            <div className="text-gray-600 mt-2 space-y-1">
                                {item.location && <p><strong>Location:</strong> {item.location}</p>}
                                {item.num_units && <p><strong>Units:</strong> {item.num_units}</p>}
                                
                                {item.unit_number && <p><strong>Unit:</strong> {item.unit_number}</p>}
                                {item.amount && <p><strong>Amount:</strong> ${item.amount.toLocaleString()}</p>}
                                {item.date && <p><strong>Date:</strong> {new Date(item.date).toLocaleDateString()}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
             {!isLoading && displayData.length === 0 && <p className="text-center text-gray-500 mt-8">No results found.</p>}
        </div>
    );
};

export default AdminDashboard;