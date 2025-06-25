// Create this new file and folder: src/pages/projects/[projectId].tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

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

const ProjectDetailPage = () => {
    const router = useRouter();
    const { projectId } = router.query;
    
    const [project, setProject] = useState<Project | null>(null);
    const [units, setUnits] = useState<Unit[]>([]);
    
    useEffect(() => {
        if (projectId) {
            // We need an endpoint to get single project details. Let's assume /builder/projects/:id
            // This reuses the new endpoint we added to builder_routes.py
            api.get(`/builder/projects/${projectId}`).then(res => setProject(res.data.project));
            api.get(`/builder/projects/${projectId}/units`).then(res => setUnits(res.data.units));
        }
    }, [projectId]);

    const handleBookUnit = (unitId: string) => {
        alert(`This would open a booking form for unit ${unitId}`);
    }

    if (!project) return <div>Loading project details...</div>;

    return (
        <ProtectedRoute allowedRoles={['builder', 'buyer']}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">{project.name}</h1>
                    <p className="text-lg text-gray-600">{project.location}</p>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <h2 className="text-xl font-semibold p-4 border-b">Available Units</h2>
                    <ul className="divide-y divide-gray-200">
                        {units.map(unit => (
                            <li key={unit.id} className="p-4 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">Unit: {unit.unit_id}</p>
                                    <p className="text-sm text-gray-500">Floor {unit.floor}, {unit.area} sq ft</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-green-600">${unit.price.toLocaleString()}</p>
                                     <button onClick={() => handleBookUnit(unit.unit_id)} className="mt-1 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                                        Book Now
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default ProjectDetailPage;