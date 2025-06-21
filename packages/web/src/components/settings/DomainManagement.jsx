import React, { useState, useEffect, useCallback } from 'react';
import useDomainStore from '../../stores/useDomainStore';
import { Trash2, Plus, AlertTriangle, Copy, Check, RefreshCw } from 'lucide-react';

const DomainManagement = ({ resourceType, resourceId }) => {
    const { domains, loading, error, fetchDomains, addDomain, removeDomain, verifyDomain } = useDomainStore();
    const [newDomain, setNewDomain] = useState('');
    const [newRole, setNewRole] = useState('READER');
    const [formError, setFormError] = useState('');
    const [copiedCode, setCopiedCode] = useState(null);
    const [verifyingId, setVerifyingId] = useState(null);

    const refreshDomains = useCallback(() => {
        if (resourceId) {
            fetchDomains(resourceType, resourceId);
        }
    }, [resourceId, resourceType, fetchDomains]);

    useEffect(() => {
        refreshDomains();
    }, [refreshDomains]);

    // Automatic re-verification interval
    useEffect(() => {
        const hasPending = domains.some(d => d.status === 'PENDING');
        if (hasPending) {
            const interval = setInterval(() => {
                domains.forEach(d => {
                    if (d.status === 'PENDING') {
                        verifyDomain(d.id, resourceType, resourceId).catch(() => {}); // Ignore errors in background check
                    }
                });
            }, 60000); // Re-check every 60 seconds
            return () => clearInterval(interval);
        }
    }, [domains, resourceType, resourceId, verifyDomain]);

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

    const handleVerifyDomain = async (domainId) => {
        setVerifyingId(domainId);
        setFormError('');
        try {
            await verifyDomain(domainId, resourceType, resourceId);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setVerifyingId(null);
        }
    };

    const handleCopy = (code) => {
        navigator.clipboard.writeText(`stagehand-verification=${code}`);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const isPrivilegedRole = newRole === 'ADMIN' || newRole === 'EDITOR';

    return (
        <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Auto-Join by Domain</h2>
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <p className="text-white/70 mb-2">Allow users to automatically join this {resourceType} if they sign up with a verified email domain.</p>
                
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

                <div className="space-y-4">
                    {loading && domains.length === 0 && <p className="text-white/70">Loading domains...</p>}
                    {domains.map(d => (
                        <div key={d.id} className="p-4 bg-black/20 rounded-lg border border-white/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="font-mono text-white">{d.domain}</span>
                                    <span className={`text-xs uppercase font-bold px-2 py-1 rounded-full ${d.status === 'VERIFIED' ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                                        {d.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                     {d.status === 'PENDING' && (
                                        <button 
                                            onClick={() => handleVerifyDomain(d.id)} 
                                            className="p-2 text-cyan-400 hover:text-cyan-300 disabled:text-gray-500 flex items-center gap-2"
                                            disabled={loading || verifyingId === d.id}
                                            title="Verify Now"
                                        >
                                            {verifyingId === d.id ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                                            <span className="hidden sm:inline">Verify</span>
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => removeDomain(d.id, resourceType, resourceId)} 
                                        className="p-2 text-red-500 hover:text-red-400 disabled:text-gray-500"
                                        disabled={loading}
                                        title="Remove domain"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            {d.status === 'PENDING' && (
                                <div className="mt-4 p-4 bg-black/30 rounded-lg">
                                    <p className="text-sm text-white/70 mb-2">To verify ownership, add the following TXT record to your DNS settings:</p>
                                    <div className="flex items-center bg-black/40 p-2 rounded-md font-mono text-sm">
                                        <span className="text-gray-400">Name:</span><span className="text-white/90 ml-2">@ or {d.domain}.</span>
                                        <span className="text-gray-400 ml-6">Content:</span>
                                        <input
                                            type="text"
                                            readOnly
                                            value={`stagehand-verification=${d.verificationCode}`}
                                            className="flex-1 bg-transparent text-white/90 ml-2 outline-none"
                                        />
                                        <button onClick={() => handleCopy(d.verificationCode)} className="p-1 text-gray-300 hover:text-white">
                                            {copiedCode === d.verificationCode ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                     ))}
                    {!loading && domains.length === 0 && <p className="text-white/70">No domains configured for auto-join.</p>}
                </div>
            </div>
        </div>
    );
};

export default DomainManagement; 