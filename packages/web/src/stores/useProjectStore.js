import { create } from 'zustand';

const useProjectStore = create((set) => {
    const initialState = {
        isLoading: false,
        error: null,
    };

    return {
        ...initialState,

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
            set({ isLoading: false });
            return newProject;
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
            set({ isLoading: false });
            return updatedProject;
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
            set({ isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
             throw error;
        }
    },

    reset: () => set(initialState),
    };
});

export default useProjectStore; 