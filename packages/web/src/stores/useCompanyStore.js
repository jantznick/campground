import { create } from 'zustand';

const useCompanyStore = create((set) => ({
    isLoading: false,
    error: null,

    // Create a new company
    createCompany: async (companyData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/v1/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(companyData),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to create company');
            }
            const newCompany = await response.json();
            set({ isLoading: false });
            return newCompany;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Update an existing company
    updateCompany: async (id, companyData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`/api/v1/companies/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(companyData),
            });
            if (!response.ok) {
                 const err = await response.json();
                throw new Error(err.error || 'Failed to update company');
            }
            const updatedCompany = await response.json();
            set({ isLoading: false });
            return updatedCompany;
        } catch (error) {
            set({ error: error.message, isLoading: false });
             throw error;
        }
    },

    // Delete a company
    deleteCompany: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`/api/v1/companies/${id}`, {
                method: 'DELETE',
            });
             if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to delete company');
            }
            set({ isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
             throw error;
        }
    },
}));

export default useCompanyStore; 