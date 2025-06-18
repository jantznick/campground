import { create } from 'zustand';

const useProjectStore = create((set) => ({
    projects: [],
    teams: [],
    isLoading: false,
    error: null,

    // Fetch all projects a user has access to
    fetchProjects: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/v1/projects');
            if (!response.ok) throw new Error('Failed to fetch projects');
            const projects = await response.json();
            set({ projects, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    // Fetch teams to populate the parent selection dropdown
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

    // Create a new project
    createProject: async (projectData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/v1/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to create project');
            }
            const newProject = await response.json();
            set((state) => ({ projects: [...state.projects, newProject], isLoading: false }));
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Update an existing project
    updateProject: async (id, projectData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`/api/v1/projects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData),
            });
            if (!response.ok) {
                 const err = await response.json();
                throw new Error(err.error || 'Failed to update project');
            }
            const updatedProject = await response.json();
            set((state) => ({
                projects: state.projects.map((p) => (p.id === id ? updatedProject : p)),
                isLoading: false,
            }));
        } catch (error) {
            set({ error: error.message, isLoading: false });
             throw error;
        }
    },

    // Delete a project
    deleteProject: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`/api/v1/projects/${id}`, {
                method: 'DELETE',
            });
             if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to delete project');
            }
            set((state) => ({
                projects: state.projects.filter((p) => p.id !== id),
                isLoading: false,
            }));
        } catch (error) {
            set({ error: error.message, isLoading: false });
             throw error;
        }
    },
}));

export default useProjectStore; 