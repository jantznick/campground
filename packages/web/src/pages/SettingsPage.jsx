import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useHierarchyStore from '../stores/useHierarchyStore';
import useOrganizationStore from '../stores/useOrganizationStore';
import useCompanyStore from '../stores/useCompanyStore';
import useTeamStore from '../stores/useTeamStore';
import useProjectStore from '../stores/useProjectStore';
import AccessManagement from '../components/settings/AccessManagement';
import { ShieldAlert, ArrowLeft, Trash2 } from 'lucide-react';

const findItemRecursive = (nodes, targetId, targetType) => {
    for (const node of nodes) {
        if (node.id === targetId && node.type === targetType) {
            return node;
        }
        
        let found = null;
        if (node.companies) {
            found = findItemRecursive(node.companies.map(c => ({ ...c, type: 'company' })), targetId, targetType);
            if (found) return found;
        }
        if (node.teams) {
            found = findItemRecursive(node.teams.map(t => ({ ...t, type: 'team' })), targetId, targetType);
            if (found) return found;
        }
        if (node.projects) {
            found = findItemRecursive(node.projects.map(p => ({ ...p, type: 'project' })), targetId, targetType);
            if (found) return found;
        }
    }
    return null;
};

const SettingsPage = () => {
    const { itemType, id } = useParams();
    const navigate = useNavigate();
    const { 
        updateItem: updateHierarchyItem, 
        removeItem: removeHierarchyItem, 
        refreshActiveCompany,
        fetchHierarchy,
        hierarchy 
    } = useHierarchyStore();

    // Get actions from all relevant stores
    const { updateOrganization, upgradeOrganization, downgradeOrganization } = useOrganizationStore();
    const { updateCompany, deleteCompany } = useCompanyStore();
    const { updateTeam, deleteTeam } = useTeamStore();
    const { updateProject, deleteProject } = useProjectStore();
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isDowngrading, setIsDowngrading] = useState(false);
    const [companyToKeep, setCompanyToKeep] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const organization = itemType === 'organization'
        ? hierarchy.find(org => org.id === id)
        : null;

    useEffect(() => {
        if (hierarchy && hierarchy.length > 0) {
            setLoading(true);
            const typedHierarchy = hierarchy.map(org => ({ ...org, type: 'organization' }));
            const foundItem = findItemRecursive(typedHierarchy, id, itemType);
            
            if (foundItem) {
                setName(foundItem.name);
                setDescription(foundItem.description || '');
                setLoading(false);
                setError(null);
            } else {
                setError(`Item not found. It might have been deleted or you don't have permission to view it.`);
                setLoading(false);
            }
        } else {
            setLoading(true);
        }
    }, [hierarchy, id, itemType]);

    const handleUpgrade = async () => {
        if (!id) return;
        try {
            await upgradeOrganization(id);
            await fetchHierarchy();
            setSuccess('Successfully upgraded to Enterprise plan!');
            setTimeout(() => setSuccess(null), 4000);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDowngradeConfirm = async () => {
        if (!companyToKeep) {
            setError('You must select a company to keep as the default.');
            return;
        }
        setError(null);
        setSuccess(null);
        try {
            await downgradeOrganization(id, companyToKeep);
            await fetchHierarchy(); 
            setIsDowngrading(false);
            setSuccess('Successfully downgraded to Standard plan.');
             setTimeout(() => setSuccess(null), 4000);

        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async () => {
        setError(null);
        try {
            switch (itemType) {
                case 'company':
                    await deleteCompany(id);
                    await fetchHierarchy();
                    break;
                case 'team':
                    await deleteTeam(id);
                    removeHierarchyItem(id, itemType);
                    refreshActiveCompany();
                    break;
                case 'project':
                    await deleteProject(id);
                    removeHierarchyItem(id, itemType);
                    refreshActiveCompany();
                    break;
                default:
                    throw new Error(`Deletion of ${itemType} is not supported.`);
            }

            navigate('/dashboard');

        } catch (err) {
            setError(err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccess(null);
        setError(null);

        try {
            const payload = { name, description };
            let updatedData;

            switch (itemType) {
                case 'organization':
                    updatedData = await updateOrganization(id, payload);
                    break;
                case 'company':
                    updatedData = await updateCompany(id, payload);
                    break;
                case 'team':
                    updatedData = await updateTeam(id, payload);
                    break;
                case 'project':
                    updatedData = await updateProject(id, payload);
                    break;
                default:
                    throw new Error(`Unsupported item type: ${itemType}`);
            }
            
            setSuccess(`${itemType} updated successfully!`);
            updateHierarchyItem({ ...updatedData, type: itemType });
			setTimeout(() => {
				setSuccess(null);
			}, 3000);

        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="p-8 text-white">Loading...</div>;

    const itemTypeIsDeletable = ['company', 'team', 'project'].includes(itemType);

    return (
        <div className="p-8 max-w-4xl min-w-3/4 mx-auto text-white">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold capitalize">{`${itemType}: ${name}`}</h1>
                <button 
                    type="button" 
                    onClick={() => navigate('/dashboard')} 
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                    <ArrowLeft size={16} /> 
                    <span>Dashboard</span>
                </button>
            </div>
			<h2 className="text-xl font-bold mb-4">General</h2>
            
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
                    <div className="flex justify-end items-center pt-4">
                        <button type="submit" className="px-5 py-2 bg-[var(--orange-wheel)] text-[var(--prussian-blue)] font-bold rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--prussian-blue)] focus:ring-[var(--orange-wheel)]">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>

            <AccessManagement resourceType={itemType} resourceId={id} />

            {itemType === 'organization' && organization && (
                <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4">Account Plan</h2>
                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                        <div className="flex justify-between items-center">
                            {organization.accountType === 'ENTERPRISE' ? (
                                <>
                                    <div>
                                        <h3 className="font-bold text-lg">Enterprise Plan</h3>
                                        <p className="text-sm text-white/60">You can manage multiple companies.</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsDowngrading(!isDowngrading)}
                                        className="px-5 py-2 bg-red-600/80 text-white font-bold rounded-lg hover:bg-red-600"
                                    >
                                        Downgrade to Standard
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <h3 className="font-bold text-lg">Standard Plan</h3>
                                        <p className="text-sm text-white/60">Upgrade to manage multiple companies.</p>
                                    </div>
                                    <button
                                        onClick={handleUpgrade}
                                        className="px-5 py-2 bg-yellow-500/80 text-white font-bold rounded-lg hover:bg-yellow-500"
                                    >
                                        Upgrade to Enterprise
                                    </button>
                                </>
                            )}
                        </div>
                        {isDowngrading && (
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <h4 className="font-bold text-md text-red-300 mb-2">Confirm Downgrade</h4>
                                <p className="text-sm text-white/60 mb-4">
                                    To downgrade, you must select one company to become the default for your organization.
                                    You will not lose any data, but you will only be able to access this single company until you upgrade again.
                                </p>
                                <div className="space-y-4 max-w-sm">
                                    <label htmlFor="company-select" className="block text-sm font-medium text-gray-300">Select Default Company</label>
                                    <select
                                        id="company-select"
                                        value={companyToKeep}
                                        onChange={(e) => setCompanyToKeep(e.target.value)}
                                        className="block w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--orange-wheel)]"
                                    >
                                        <option value="" disabled>-- Please select a company --</option>
                                        {organization.companies.map(company => (
                                            <option key={company.id} value={company.id}>{company.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex justify-end gap-4 mt-6">
                                    <button onClick={() => setIsDowngrading(false)} className="px-5 py-2 text-white/80 font-bold rounded-lg hover:bg-white/10">
                                        Cancel
                                    </button>
                                    <button onClick={handleDowngradeConfirm} className="px-5 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">
                                        Confirm and Downgrade
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {itemTypeIsDeletable && (
                 <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4 text-red-400">Danger Zone</h2>
                    <div className="bg-red-900/50 p-6 rounded-xl border border-red-500/50">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-red-300">Delete this {itemType}</h3>
                                <p className="text-sm text-red-300/80">Once you delete it, there is no going back. Please be certain.</p>
                            </div>
                            <button 
                                onClick={() => setIsDeleting(!isDeleting)}
                                className="px-5 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
                            >
                                {isDeleting ? 'Cancel' : `Delete ${itemType}`}
                            </button>
                        </div>
                        {isDeleting && (
                            <div className="mt-6 pt-6 border-t border-red-500/50">
                                <h4 className="font-bold text-md text-red-300 mb-4">Are you absolutely sure?</h4>
                                <div className="flex justify-end">
                                    <button 
                                        onClick={handleDelete} 
                                        className="px-5 py-2 bg-red-800 text-white font-bold rounded-lg hover:bg-red-700 w-full"
                                    >
                                        I understand the consequences, delete this {itemType}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage; 