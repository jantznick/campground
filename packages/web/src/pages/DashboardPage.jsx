import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Building, Briefcase, Users, Folder, Play, ArrowRight } from 'lucide-react';

const icons = {
    organization: <Building size={28} className="text-[var(--orange-wheel)]" />,
    company: <Briefcase size={28} className="text-[var(--orange-wheel)]" />,
    team: <Users size={28} className="text-[var(--orange-wheel)]" />,
    project: <Folder size={28} className="text-[var(--orange-wheel)]" />,
};

function DashboardPage() {
    const { teamId, projectId } = useParams();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchItem = async () => {
            const id = teamId || projectId;
            const type = teamId ? 'team' : 'project';

            if (!id) {
                setItem(null);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                // The API endpoints for single items are plural (e.g., /api/v1/teams/:id)
                const response = await fetch(`/api/v1/${type}s/${id}`);
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || `Failed to fetch ${type}`);
                }
                const data = await response.json();
                setItem({ ...data, type });
            } catch (err) {
                setError(err.message);
                setItem(null);
            } finally {
                setLoading(false);
            }
        };

        fetchItem();
    }, [teamId, projectId]);


    return (
        <div className="p-8 max-w-4xl min-w-3/4 mx-auto text-white">
             <h1 className="text-4xl font-bold text-white mb-8">Dashboard</h1>

			{loading ? (
                <div className="text-center p-12 text-white/60">Loading...</div>
            ) : error ? (
                <div className="text-center p-12 bg-red-900/50 border border-red-500/50 rounded-xl">
                    <h2 className="text-2xl font-bold text-red-300">Error</h2>
                    <p className="text-red-400">{error}</p>
                </div>
            ) : !item ? (
                <div className="text-center p-12 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center">
                    <div className="w-16 h-16 bg-[var(--orange-wheel)]/10 rounded-full flex items-center justify-center mb-4">
                        <Play size={32} className="text-[var(--orange-wheel)]"/>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">Welcome to Campground</h2>
                    <p className="text-[var(--vanilla)]/60">Select an item from the sidebar to get started.</p>
                </div>
			) : (
                <div className="bg-white/5 p-8 rounded-xl border border-white/10">
                    <div className="flex items-center mb-6">
                        <div className="mr-5 flex-shrink-0 bg-[var(--orange-wheel)]/10 p-3 rounded-lg">
                            {icons[item.type]}
                        </div>
                        <div className="flex-grow">
                            <p className="text-sm text-[var(--vanilla)]/60 font-semibold uppercase tracking-wider">{item.type}</p>
                            <h2 className="text-3xl font-bold text-white capitalize truncate">{item.name}</h2>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                        <p className="text-[var(--vanilla)]/80">{item.description || 'No description available for this item.'}</p>
                    </div>
                </div>
			)}
        </div>
    );
}

export default DashboardPage; 