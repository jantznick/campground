import React, { useState, useEffect } from 'react';
import useHierarchyStore from '../../stores/useHierarchyStore';
import useOrganizationStore from '../../stores/useOrganizationStore';
import useAuthStore from '../../stores/useAuthStore';

const HierarchySettings = () => {
    const { 
        getDisplayName, 
        activeOrganization, 
        updateHierarchyDisplayNames,
        isLoading, 
    } = useHierarchyStore();
    const { updateOrganization, isLoading: orgLoading } = useOrganizationStore();
    const { user } = useAuthStore();
    
    const [displayNames, setDisplayNames] = useState({
        organization: { singular: '', plural: '' },
        company: { singular: '', plural: '' },
        team: { singular: '', plural: '' },
        project: { singular: '', plural: '' },
    });
    const [isAdmin, setIsAdmin] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        if (activeOrganization) {
            // Pre-fill the form with existing custom names or defaults from the store
            const initialNames = ['organization', 'company', 'team', 'project'].reduce((acc, type) => {
                acc[type] = {
                    singular: getDisplayName(type, 'singular'),
                    plural: getDisplayName(type, 'plural')
                };
                return acc;
            }, {});
            setDisplayNames(initialNames);

            const membership = user.memberships.find(m => m.organizationId === activeOrganization.id);
            setIsAdmin(membership?.role === 'ADMIN');
        }
    }, [activeOrganization, getDisplayName, user.memberships]);

    useEffect(() => {
        if (activeOrganization?.hierarchyDisplayNames) {
            // Deep merge to handle cases where some names might not be set
            const newNames = JSON.parse(JSON.stringify(displayNames));
            for (const type in newNames) {
                if (activeOrganization.hierarchyDisplayNames[type]) {
                    newNames[type].singular = activeOrganization.hierarchyDisplayNames[type].singular || '';
                    newNames[type].plural = activeOrganization.hierarchyDisplayNames[type].plural || '';
                }
            }
            setDisplayNames(newNames);
        }
    }, [activeOrganization]);

    const handleChange = (type, form, value) => {
        setDisplayNames(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [form]: value,
            },
        }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        if (!activeOrganization) {
            setError("No active organization selected.");
            return;
        }
        try {
            await updateHierarchyDisplayNames(activeOrganization.id, displayNames);
            setSuccess('Display names updated successfully!');
        } catch (err) {
            setError(err.message);
        } finally {
            setTimeout(() => {
                setSuccess(null);
                setError(null);
            }, 3000);
        }
    };

    if (!activeOrganization) {
        return null; // Don't render if there's no active org
    }

    const renderNameInput = (type) => (
        <div key={type} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <label className="font-semibold capitalize text-gray-300">{getDisplayName(type, 'plural')}</label>
            <input
                type="text"
                value={displayNames[type]?.singular || ''}
                onChange={(e) => handleChange(type, 'singular', e.target.value)}
                disabled={!isAdmin}
                className="col-span-1 px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange-wheel)] disabled:bg-black/10 disabled:cursor-not-allowed"
                placeholder={`e.g., ${getDisplayName(type, 'singular')}`}
            />
            <input
                type="text"
                value={displayNames[type]?.plural || ''}
                onChange={(e) => handleChange(type, 'plural', e.target.value)}
                disabled={!isAdmin}
                className="col-span-1 px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange-wheel)] disabled:bg-black/10 disabled:cursor-not-allowed"
                placeholder={`e.g., ${getDisplayName(type, 'plural')}`}
            />
        </div>
    );
    
    return (
        <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Hierarchy Terminology</h2>
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                {error && <div className="mb-4 text-red-400 bg-red-900/50 p-3 rounded-lg border border-red-400/50">{error}</div>}
                {success && <div className="mb-4 text-green-400 bg-green-900/50 p-3 rounded-lg border border-green-400/50">{success}</div>}

                <p className="mb-6 text-white/70">
                    Customize the terminology used across the application to match your organization's internal language.
                    { !isAdmin && <span className="text-sm block mt-1 text-orange-400">You must be an Organization Admin to edit these settings.</span>}
                </p>
                <form onSubmit={handleSubmit} className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center font-bold text-sm uppercase tracking-wider text-white/60">
                        <span className="md:col-start-1">Level</span>
                        <span className="md:col-start-2">Singular Name</span>
                        <span className="md:col-start-3">Plural Name</span>
                    </div>
                    {['organization', 'company', 'team', 'project'].map(type => renderNameInput(type))}
                    {isAdmin && (
                        <div className="mt-6 text-right border-t border-white/10 pt-6">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-5 py-2 bg-[var(--orange-wheel)] text-[var(--prussian-blue)] font-bold rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--prussian-blue)] focus:ring-[var(--orange-wheel)] disabled:opacity-50"
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default HierarchySettings; 