import { create } from 'zustand';

const useHierarchyStore = create((set) => ({
    hierarchy: [],
    selectedItem: null,
    isLoading: false,
    error: null,

    fetchHierarchy: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/v1/hierarchy');
            if (!response.ok) {
                throw new Error('Failed to fetch hierarchy data');
            }
            const hierarchy = await response.json();
            set({ hierarchy, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    setSelectedItem: (item) => set({ selectedItem: item }),

    updateItem: (updatedItem) => set(state => {
        const update = (items) => {
            if (!items) return [];
            return items.map(item => {
                if (item.id === updatedItem.id && item.type === updatedItem.type) {
                    return { ...item, name: updatedItem.name, description: updatedItem.description };
                }
                
                const newCompanies = item.companies ? update(item.companies) : undefined;
                const newTeams = item.teams ? update(item.teams) : undefined;
                const newProjects = item.projects ? update(item.projects) : undefined;

                const newItem = { ...item };
                if (newCompanies) newItem.companies = newCompanies;
                if (newTeams) newItem.teams = newTeams;
                if (newProjects) newItem.projects = newProjects;
                
                return newItem;
            });
        };

        const newHierarchy = update(state.hierarchy);
        
        const newSelectedItem = (state.selectedItem?.id === updatedItem.id && state.selectedItem?.type === updatedItem.type) ? 
            { ...state.selectedItem, name: updatedItem.name, description: updatedItem.description } :
            state.selectedItem;

        return { hierarchy: newHierarchy, selectedItem: newSelectedItem };
    }),
}));

export default useHierarchyStore; 