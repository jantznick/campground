import React, { useState, useEffect } from 'react';
import useDomainStore from '../../stores/useDomainStore';
import { Trash2, Plus, AlertTriangle } from 'lucide-react';

const DomainManagement = ({ resourceType, resourceId }) => {
    const { domains, loading, error, fetchDomains, addDomain, removeDomain } = useDomainStore();
    const [newDomain, setNewDomain] = useState('');
    const [newRole, setNewRole] = useState('READER');
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (resourceId) {
            fetchDomains(resourceType, resourceId);
        }
    }, [resourceType, resourceId, fetchDomains]);

    const handleAddDomain = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!newDomain) {
            setFormError('Domain cannot be empty.');
            return;
        }
        try {
            await addDomain(newDomain, newRole, resourceType, resourceId);
            setNewDomain('');
            setNewRole('READER');
        } catch (err) {
            setFormError(err.message);
        }
    };

    const isPrivilegedRole = newRole === 'ADMIN' || newRole === 'EDITOR';

    return (
        <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Auto-Join by Domain</h2>
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <p className="text-white/70 mb-2">Allow users to automatically join this {resourceType} if they sign up with an email from a specified domain.</p>
                
                {/* Add Domain Form */}
                <form onSubmit={handleAddDomain} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 my-6">
                    <input
                        type="text"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder="example.com"
                        className="flex-grow w-full sm:w-auto px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange-wheel)]"
                    />
                    <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange-wheel)] w-full sm:w-auto"
                    >
                        <option value="READER">Reader</option>
                        <option value="EDITOR">Editor</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-[var(--orange-wheel)] text-[var(--prussian-blue)] font-bold rounded-lg hover:bg-opacity-90 disabled:bg-opacity-50 flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                        <Plus size={16} /> Add Domain
                    </button>
                </form>

                {(formError || error) && <div className="text-red-400 mb-4">{formError || error}</div>}
                
                {isPrivilegedRole && (
                     <div className="bg-yellow-900/50 border border-yellow-400/50 text-yellow-300 px-4 py-3 rounded-lg relative mb-6 flex items-start gap-3">
                        <AlertTriangle size={20} className="flex-shrink-0 mt-1" />
                        <div>
                            <strong className="font-bold">Warning: Privileged Role Selected</strong>
                            <p className="text-sm">Any new user signing up with this domain will be granted <span className="font-bold">{newRole}</span> permissions. This could lead to unintended access. We recommend the 'Reader' role for general auto-joining.</p>
                        </div>
                    </div>
                )}

                {/* Domain List */}
                <div className="space-y-3">
                    {loading && domains.length === 0 ? <p className="text-white/70">Loading domains...</p> :
                     domains.map(d => (
                        <div key={d.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                            <div className="flex items-center gap-4">
                                <span className="font-mono text-white">{d.domain}</span>
                                <span className="text-xs uppercase font-bold text-gray-400 bg-black/30 px-2 py-1 rounded-full">{d.role}</span>
                            </div>
                            <button 
                                onClick={() => removeDomain(d.id, resourceType, resourceId)} 
                                className="text-red-500 hover:text-red-400 disabled:text-gray-500"
                                disabled={loading}
                                title="Remove domain"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                     ))}
                    {!loading && domains.length === 0 && <p className="text-white/70">No domains configured for auto-join.</p>}
                </div>
            </div>
        </div>
    );
};

export default DomainManagement; 