import { create } from 'zustand';

const useTeamStore = create((set) => ({
    teams: [],
    companies: [],
    isLoading: false,
    error: null,

    // Fetch all teams a user has access to
    fetchTeams: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/v1/teams');
            if (!response.ok) throw new Error('Failed to fetch teams');
            const teams = await response.json();
            set({ teams, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    // Fetch companies to populate the parent selection dropdown
    fetchCompanies: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/v1/companies');
            if (!response.ok) throw new Error('Failed to fetch companies');
            const companies = await response.json();
            set({ companies, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    // Create a new team
    createTeam: async (teamData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/v1/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(teamData),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to create team');
            }
            const newTeam = await response.json();
            set((state) => ({ teams: [...state.teams, newTeam], isLoading: false }));
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Update an existing team
    updateTeam: async (id, teamData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`/api/v1/teams/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(teamData),
            });
            if (!response.ok) {
                 const err = await response.json();
                throw new Error(err.error || 'Failed to update team');
            }
            const updatedTeam = await response.json();
            set((state) => ({
                teams: state.teams.map((t) => (t.id === id ? updatedTeam : t)),
                isLoading: false,
            }));
        } catch (error) {
            set({ error: error.message, isLoading: false });
             throw error;
        }
    },

    // Delete a team
    deleteTeam: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`/api/v1/teams/${id}`, {
                method: 'DELETE',
            });
             if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to delete team');
            }
            set((state) => ({
                teams: state.teams.filter((t) => t.id !== id),
                isLoading: false,
            }));
        } catch (error) {
            set({ error: error.message, isLoading: false });
             throw error;
        }
    },
}));

export default useTeamStore; 