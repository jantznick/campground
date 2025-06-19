import { create } from 'zustand';

const useTeamStore = create((set) => {
    const initialState = {
        isLoading: false,
        error: null,
    };
    return {
        ...initialState,
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
                set({ isLoading: false });
                return newTeam;
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
                set({ isLoading: false });
                return updatedTeam;
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
                set({ isLoading: false });
            } catch (error) {
                set({ error: error.message, isLoading: false });
                throw error;
            }
        },

        reset: () => set(initialState),
    };
});

export default useTeamStore; 