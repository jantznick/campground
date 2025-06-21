import { create } from 'zustand';

const useDomainStore = create((set) => ({
    domains: [],
    loading: false,
    error: null,

    fetchDomains: async (resourceType, resourceId) => {
        set({ loading: true, error: null });
        try {
            const response = await fetch(`/api/v1/${resourceType}s/${resourceId}/domains`);
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || `Failed to fetch domains for ${resourceType}`);
            }
            const domains = await response.json();
            set({ domains, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    addDomain: async (domain, role, resourceType, resourceId) => {
        set({ loading: true, error: null });
        try {
            const response = await fetch(`/api/v1/${resourceType}s/${resourceId}/domains`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain, role }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to add domain');
            }
            const newDomain = await response.json();
            set((state) => ({
                domains: [...state.domains, newDomain],
                loading: false
            }));
            return newDomain;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error; // Re-throw to be caught in the component
        }
    },

    verifyDomain: async (domainMappingId, resourceType, resourceId) => {
        set({ loading: true, error: null });
        try {
            const response = await fetch(`/api/v1/${resourceType}s/${resourceId}/domains/${domainMappingId}/verify`, {
                method: 'POST',
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to verify domain');
            }
            const updatedDomain = await response.json();
            set((state) => ({
                domains: state.domains.map((d) => d.id === domainMappingId ? updatedDomain : d),
                loading: false
            }));
            return updatedDomain;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    removeDomain: async (domainMappingId, resourceType, resourceId) => {
        set({ loading: true, error: null });
        try {
            const response = await fetch(`/api/v1/${resourceType}s/${resourceId}/domains/${domainMappingId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                 const err = await response.json();
                throw new Error(err.error || 'Failed to remove domain');
            }
            set((state) => ({
                domains: state.domains.filter((d) => d.id !== domainMappingId),
                loading: false
            }));
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error; // Re-throw to be caught in the component
        }
    },
}));

export default useDomainStore; 