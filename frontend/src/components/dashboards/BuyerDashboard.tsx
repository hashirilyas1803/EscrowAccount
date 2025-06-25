import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

/**
 * The main dashboard for the Buyer role, showing their current bookings
 * and a list of all available projects to browse.
 */
const BuyerDashboard = () => {
    const [myBookings, setMyBookings] = useState<any[]>([]);
    const [allProjects, setAllProjects] = useState<any[]>([]);

    useEffect(() => {
        // Fetch the current buyer's bookings.
        api.get('/buyer/bookings').then(res => setMyBookings(res.data.bookings));
        // Fetch all projects available on the platform for browsing.
        api.get('/buyer/projects').then(res => {
            if (res.data.projects) setAllProjects(res.data.projects);
        });
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* My Bookings Section */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">My Booked Units</h2>
                <div className="space-y-4">
                    {myBookings.length > 0 ? (
                        myBookings.map(booking => (
                            <div key={booking.id} className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-bold text-green-700">Unit: {booking.unit_number}</h3>
                                <p className="text-gray-600">Booking Amount: ${booking.amount.toLocaleString()}</p>
                                <p className="text-gray-600">Date: {new Date(booking.date).toLocaleDateString()}</p>
                            </div>
                        ))
                    ) : <p className="text-gray-500 mt-4">You have no bookings yet.</p>}
                </div>
            </div>

            {/* Available Projects Section */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">Available Projects</h2>
                <div className="space-y-4">
                    {allProjects.length > 0 ? (
                        allProjects.map(project => (
                             <div key={project.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                                <h3 className="text-xl font-bold text-indigo-700">{project.name}</h3>
                                <p className="text-gray-600">Location: {project.location}</p>
                                <p className="text-gray-600">Total Units: {project.num_units}</p>
                                <Link href={`/projects/${project.id}`} legacyBehavior>
                                    <a className="mt-4 inline-block bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 font-semibold">
                                        View Units & Book
                                    </a>
                                </Link>
                            </div>
                        ))
                    ) : <p className="text-gray-500 mt-4">No projects available at the moment.</p>}
                </div>
            </div>
        </div>
    );
};

export default BuyerDashboard;