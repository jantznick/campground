import { create } from 'zustand';

const useMembershipStore = create((set) => ({
    members: [],
    loading: false,
    error: null,
    invitationLink: null,

    fetchMembers: async (resourceType, resourceId) => {
        set({ loading: true, error: null });
        try {
            const response = await fetch(`/api/v1/memberships?${resourceType}Id=${resourceId}`);
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to fetch members');
            }
            const data = await response.json();
            set({ members: data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    addMember: async (email, role, resourceType, resourceId) => {
        set({ loading: true, error: null, invitationLink: null });
        try {
            const response = await fetch('/api/v1/memberships', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role, resourceType, resourceId })
            });
             if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to add member');
            }
            const data = await response.json();
            
            if (data.invitationLink) {
                set({ invitationLink: data.invitationLink, loading: false });
            } else {
                set((state) => ({
                    members: [...state.members, data],
                    loading: false,
                }));
            }
            return data;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    removeMember: async (membershipId) => {
        set({ loading: true, error: null });
        try {
             await fetch(`/api/v1/memberships/${membershipId}`, {
                method: 'DELETE',
            });
            set((state) => ({
                members: state.members.filter((m) => m.id !== membershipId),
                loading: false,
            }));
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updateMemberRole: async (membershipId, role) => {
        set({ loading: true, error: null });
        try {
            const response = await fetch(`/api/v1/memberships/${membershipId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role })
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to update member role');
            }
            const data = await response.json();
            set((state) => ({
                members: state.members.map((m) =>
                    m.id === membershipId ? data : m
                ),
                loading: false,
            }));
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    resendInvitation: async (userId) => {
        set({ loading: true, error: null, invitationLink: null });
        try {
            const response = await fetch('/api/v1/invitations/resend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to resend invitation');
            }
            const data = await response.json();
            set({ invitationLink: data.invitationLink, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },
}));

export default useMembershipStore; 