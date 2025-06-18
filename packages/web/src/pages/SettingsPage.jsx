import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import useHierarchyStore from '../stores/useHierarchyStore';

const itemTypeToEndpoint = {
    organization: 'organizations',
    company: 'companies',
    team: 'teams',
    project: 'projects',
};

const SettingsPage = () => {
    const { itemType, id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuthStore.getState();
    const updateItem = useHierarchyStore((state) => state.updateItem);
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const apiEndpoint = itemTypeToEndpoint[itemType];

    const fetchData = useCallback(async () => {
        if (!apiEndpoint) {
            setError('Invalid item type.');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = await fetch(`/api/v1/${apiEndpoint}/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to fetch item data.');
            }
            const data = await response.json();
            setName(data.name);
            setDescription(data.description || '');
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id, apiEndpoint, token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccess(null);
        setError(null);

        if (!apiEndpoint) {
            setError('Invalid item type.');
            return;
        }

        try {
            const response = await fetch(`/api/v1/${apiEndpoint}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name, description }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || `Failed to update ${String(itemType).charAt(0).toUpperCase() + String(itemType).slice(1)}.`);
            }
            
            const updatedData = await response.json();
            setSuccess(`${String(itemType).charAt(0).toUpperCase() + String(itemType).slice(1)} updated successfully!`);
            
            // Update the hierarchy in the store without re-fetching
            updateItem({ ...updatedData, type: itemType });
			setTimeout(() => {
				setSuccess(null);
			}, 3000);

        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="p-8 text-white">Loading...</div>;

    return (
        <div className="p-8 max-w-4xl min-w-3/4 mx-auto text-white">
            <h1 className="text-3xl font-bold capitalize mb-6">{`Settings for ${itemType}: ${name}`}</h1>
            
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                {error && <div className="mb-4 text-red-400 bg-red-900/50 p-3 rounded-lg border border-red-400/50">{error}</div>}
                {success && <div className="mb-4 text-green-400 bg-green-900/50 p-3 rounded-lg border border-green-400/50">{success}</div>}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 uppercase tracking-wider mb-2">Name</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="block w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--orange-wheel)] focus:border-[var(--orange-wheel)] sm:text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300 uppercase tracking-wider mb-2">Description</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="5"
                            className="block w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--orange-wheel)] focus:border-[var(--orange-wheel)] sm:text-sm"
                        />
                    </div>
                    <div className="flex justify-between items-center pt-4">
                         <button type="button" onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white transition-colors">
                            &larr; Back
                        </button>
                        <button type="submit" className="px-5 py-2 bg-[var(--orange-wheel)] text-[var(--prussian-blue)] font-bold rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--prussian-blue)] focus:ring-[var(--orange-wheel)]">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingsPage; 