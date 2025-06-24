import React, { useState, useEffect } from 'react';
import useMembershipStore from '../../stores/useMembershipStore';
import useAuthStore from '../../stores/useAuthStore';
import { Trash2, Edit, Save, X, Plus, Copy, Check, Send, Info } from 'lucide-react';
import ConfirmationModal from '../ConfirmationModal';

const Tooltip = ({ children, text }) => {
    const [show, setShow] = useState(false);
    return (
        <div className="relative flex items-center" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
            {children}
            {show && (
                <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-black text-white text-xs rounded-md shadow-lg z-10">
                    {text}
                </div>
            )}
        </div>
    );
};

const AccessManagement = ({ resourceType, resourceId }) => {
    const { members, fetchMembers, addMember, removeMember, updateMemberRole, resendInvitation, loading, error, invitationLink } = useMembershipStore();
    const { user } = useAuthStore();
    const [isAdmin, setIsAdmin] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberRole, setNewMemberRole] = useState('READER');
    const [editingMemberId, setEditingMemberId] = useState(null);
    const [editingRole, setEditingRole] = useState('');
    const [copied, setCopied] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);

    useEffect(() => {
        if (resourceId) {
            fetchMembers(resourceType, resourceId);
        }
    }, [resourceType, resourceId, fetchMembers]);

    useEffect(() => {
        if (members && user) {
            const currentUserMembership = members.find(m => m.user.id === user.id);
            if (currentUserMembership && currentUserMembership.effectiveRole === 'ADMIN') {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        }
    }, [members, user]);

    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            await addMember(newMemberEmail, newMemberRole, resourceType, resourceId);
            setNewMemberEmail('');
            setNewMemberRole('READER');
        } catch (err) {
            // Error is handled in the store, but you could add specific UI feedback here
            console.error(err);
        }
    };

    const handleUpdateRole = async (member) => {
        try {
            // If the member has no direct membership ID, it's a viewer being promoted.
            if (!member.id) {
                await addMember(member.user.email, editingRole, resourceType, resourceId);
            } else {
                await updateMemberRole(member.id, editingRole, resourceType, resourceId);
            }
            setEditingMemberId(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemoveMember = async () => {
        if (memberToDelete) {
            await removeMember(memberToDelete.id);
            setMemberToDelete(null);
        }
    };

    const startEditing = (member) => {
        setEditingMemberId(member.user.id);
        // If editing a viewer, default to READER, otherwise use their current role.
        setEditingRole(member.effectiveRole === 'VIEWER' ? 'READER' : member.effectiveRole);
    };

    const cancelEditing = () => {
        setEditingMemberId(null);
        setEditingRole('');
    };

    const handleCopyToClipboard = (text) => {
		console.log('handleCopyToClipboard', text);
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Access Management</h2>
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                {/* Add Member Form */}
                <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                    <input
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="flex-grow w-full sm:w-auto px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange-wheel)] disabled:bg-black/10 disabled:cursor-not-allowed"
                        required
                        disabled={!isAdmin}
                    />
                    <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        className="px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange-wheel)] w-full sm:w-auto disabled:bg-black/10 disabled:cursor-not-allowed"
                        disabled={!isAdmin}
                    >
                        <option value="READER">Reader</option>
                        <option value="EDITOR">Editor</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                    <button
                        type="submit"
                        disabled={loading || !isAdmin}
                        className="px-4 py-2 bg-[var(--orange-wheel)] text-[var(--prussian-blue)] font-bold rounded-lg hover:bg-opacity-90 disabled:bg-opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                        <Plus size={16} /> Add Member
                    </button>
                </form>
                {!isAdmin && <p className="text-orange-400 text-sm -mt-4 mb-6">You must be an Admin to manage members.</p>}

                {error && <div className="text-red-400 mb-4">{error}</div>}

                {invitationLink && (
                    <div className="bg-blue-900/50 border border-blue-400/50 text-blue-300 px-4 py-3 rounded-lg flex items-start justify-between gap-4 mb-6" role="alert">
                        <div className="flex-grow">
                            <strong className="font-bold">Invitation Link Generated!</strong>
                            <p className="block sm:inline text-blue-200">Share this link with the new user to complete their registration.</p>
                            <div className="flex items-center mt-2 bg-black/30 p-2 rounded-md">
                                <input type="text" value={invitationLink} readOnly className="bg-transparent text-white/80 w-full outline-none" />
                                <button onClick={() => handleCopyToClipboard(invitationLink)} className="ml-2 p-1 text-gray-300 hover:text-white" title="Copy to clipboard">
                                    {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                                </button>
                            </div>
                        </div>
                         <button className="p-1 text-blue-300 hover:text-white flex-shrink-0" onClick={() => useMembershipStore.setState({ invitationLink: null })} title="Close">
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Members List */}
                <div className="space-y-4">
                    {loading && members.length === 0 ? <p>Loading members...</p> :
                     members.map(member => {
                        const isDirectMember = member.roleSourceId === resourceId;
                        return (
                        <div key={member.user.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                            <div className="flex items-center gap-3">
                                <span className="font-medium">{member.user.email}</span>
                                {member.user.status === 'PENDING' && (
                                    <span className="text-xs uppercase font-bold text-yellow-400 bg-yellow-900/50 px-2 py-1 rounded-full">
                                        Pending
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                {member.user.status === 'ACTIVE' && (
                                    editingMemberId === member.user.id ? (
                                        <>
                                            <select
                                                value={editingRole}
                                                onChange={(e) => setEditingRole(e.target.value)}
                                                className="px-4 py-1 bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--orange-wheel)]"
                                                disabled={!isAdmin}
                                            >
                                                <option value="READER">Reader</option>
                                                <option value="EDITOR">Editor</option>
                                                <option value="ADMIN">Admin</option>
                                            </select>
                                            <button onClick={() => handleUpdateRole(member)} className="text-green-400 hover:text-green-300"><Save size={18} /></button>
                                            <button onClick={cancelEditing} className="text-gray-400 hover:text-white"><X size={18} /></button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-sm uppercase text-gray-400 px-2 py-1 bg-black/30 rounded-md">{member.effectiveRole}</span>
                                            {isAdmin ? (
                                                <button onClick={() => startEditing(member)} className="text-gray-400 hover:text-white"><Edit size={18} /></button>
                                            ) : (
                                                 !member.id && ( // Show info icon for viewers if not admin
                                                    <Tooltip text={member.roleSource}>
                                                        <Info size={16} className="text-gray-400" />
                                                    </Tooltip>
                                                )
                                            )}
                                        </>
                                    )
                                )}

                                {member.user.status === 'PENDING' && (
                                    <button
                                        onClick={() => resendInvitation(member.user.id)}
                                        className="text-gray-300 hover:text-[var(--orange-wheel)] transition-colors flex items-center gap-2 text-sm"
                                        disabled={loading}
                                    >
                                        <Send size={16} /> Resend Invite
                                    </button>
                                )}

                                {member.id && isAdmin && (
                                    <button onClick={() => setMemberToDelete(member)} className="text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                                )}
                            </div>
                        </div>
                     )})}
                    {!loading && members.length === 0 && <p>No members found.</p>}
                </div>
            </div>
            {memberToDelete && (
                <ConfirmationModal
                    isOpen={!!memberToDelete}
                    onClose={() => setMemberToDelete(null)}
                    onConfirm={handleRemoveMember}
                    title="Remove Member"
                    message={`Are you sure you want to remove ${memberToDelete.user.email}? They will lose all direct access provided by this membership.`}
                    confirmText="Remove"
                    isLoading={loading}
                />
            )}
        </div>
    );
};

export default AccessManagement; 