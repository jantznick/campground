import { create } from 'zustand';

const useOrganizationStore = create((set) => {
    const initialState = {
    isLoading: false,
    error: null,
    };

    return {
        ...initialState,

    // Create a new organization
    createOrganization: async (orgData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/v1/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orgData),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to create organization');
            }
            const newOrg = await response.json();
            set({ isLoading: false });
            return newOrg;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },
    
    // Update an existing organization
    updateOrganization: async (id, orgData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`/api/v1/organizations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orgData),
            });
            if (!response.ok) {
                 const err = await response.json();
                throw new Error(err.error || 'Failed to update organization');
            }
            const updatedOrg = await response.json();
            set({ isLoading: false });
            return updatedOrg;
        } catch (error) {
            set({ error: error.message, isLoading: false });
             throw error;
        }
    },

    // Upgrade an organization to Enterprise
    upgradeOrganization: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`/api/v1/organizations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountType: 'ENTERPRISE' }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to upgrade organization.');
            }
            const updatedOrg = await response.json();
            set({ isLoading: false });
            return updatedOrg;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Downgrade an organization to Standard
    downgradeOrganization: async (id, defaultCompanyId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`/api/v1/organizations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountType: 'STANDARD',
                    defaultCompanyId,
                }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to downgrade organization.');
            }
            const updatedOrg = await response.json();
            set({ isLoading: false });
            return updatedOrg;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Delete an organization
    deleteOrganization: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`/api/v1/organizations/${id}`, {
                method: 'DELETE',
            });
             if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to delete organization');
            }
            set({ isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
             throw error;
        }
    },

    reset: () => set(initialState),
    };
});

export default useOrganizationStore; 