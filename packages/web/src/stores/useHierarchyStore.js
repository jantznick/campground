import { create } from 'zustand';
import { produce } from 'immer';

// Helper to find an item and its parent in the hierarchy
const findItemAndParent = (nodes, findFn, parent = null) => {
    for (const node of nodes) {
        if (findFn(node)) {
            return { item: node, parent: parent };
        }
        const children = [...(node.companies || []), ...(node.teams || []), ...(node.projects || [])];
        const result = findItemAndParent(children, findFn, node);
        if (result) {
            return result;
        }
    }
    return null;
};

// Helper to recursively apply updates using Immer
const mutator = (nodes, findFn, updateFn) => {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (findFn(node)) {
            updateFn(nodes, i, node);
            return true;
        }
        if (node.companies && mutator(node.companies, findFn, updateFn)) return true;
        if (node.teams && mutator(node.teams, findFn, updateFn)) return true;
        if (node.projects && mutator(node.projects, findFn, updateFn)) return true;
    }
    return false;
};

const useHierarchyStore = create((set, get) => {
    const initialState = {
        hierarchy: [],
        activeOrganization: null,
        selectedItem: null,
        activeCompany: null,
        accountType: 'STANDARD',
        isLoading: false,
        error: null,
    };

    return {
    ...initialState,

    setInitialActiveItems: () => set(state => {
        if (!state.hierarchy || state.hierarchy.length === 0 || state.activeOrganization) {
            return {}; // No data to set or already set
        }
        const initialOrg = state.hierarchy[0];
        let initialCompany = null;
        if (initialOrg.accountType === 'STANDARD' && initialOrg.defaultCompanyId) {
            initialCompany = initialOrg.companies?.find(c => c.id === initialOrg.defaultCompanyId) || initialOrg.companies?.[0] || null;
        } else {
            initialCompany = initialOrg.companies?.[0] || null;
        }

        return { 
            activeOrganization: initialOrg, 
            activeCompany: initialCompany,
            accountType: initialOrg.accountType || 'STANDARD'
        };
    }),
    
    setActiveOrganization: (organization) => set(state => {
        let newActiveCompany = null;
        if (organization.accountType === 'STANDARD' && organization.defaultCompanyId) {
            newActiveCompany = organization.companies?.find(c => c.id === organization.defaultCompanyId) || organization.companies?.[0] || null;
        } else {
            newActiveCompany = organization.companies?.[0] || null;
        }

        return { 
            activeOrganization: organization, 
            activeCompany: newActiveCompany, 
            selectedItem: organization,
            accountType: organization.accountType || 'STANDARD'
        };
    }),

    fetchHierarchy: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/v1/hierarchy');
            if (!response.ok) throw new Error('Failed to fetch hierarchy data');
            
            const hierarchy = await response.json();
            
            set({ hierarchy, isLoading: false }); // Only sets the data, no more UI logic
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    setSelectedItem: (item) => set({ selectedItem: item }),
    setActiveCompany: (company) => set({ activeCompany: company, selectedItem: company }),

    // Replaces the old complex updateItem with granular, immutable updates using Immer
    addItem: (item, parentId, parentType) => set(produce(draft => {
        if (!parentId) { // This handles adding an organization at the root
            if (item.type === 'organization') {
                draft.hierarchy.push(item);
            }
            return;
        }

        const findAndAdd = (nodes) => {
            for (const node of nodes) {
                if (node.id === parentId && node.type === parentType) {
                    switch(item.type) {
                        case 'company':
                            if (!node.companies) node.companies = [];
                            node.companies.push(item);
                            break;
                        case 'team':
                            if (!node.teams) node.teams = [];
                            node.teams.push(item);
                            break;
                        case 'project':
                            if (!node.projects) node.projects = [];
                            node.projects.push(item);
                            break;
                    }
                    return true;
                }
                if (node.companies && findAndAdd(node.companies)) return true;
                if (node.teams && findAndAdd(node.teams)) return true;
                if (node.projects && findAndAdd(node.projects)) return true;
            }
            return false;
        };

        findAndAdd(draft.hierarchy);
    })),

    removeItem: (itemId, itemType) => set(produce(draft => {
        mutator(draft.hierarchy,
            node => node.id === itemId && node.type === itemType,
            (nodes, index) => nodes.splice(index, 1)
        );
    })),

    updateItem: (updatedItem) => set(produce(draft => {
        mutator(draft.hierarchy,
            node => node.id === updatedItem.id && node.type === updatedItem.type,
            (nodes, index) => {
                nodes[index] = { ...nodes[index], ...updatedItem };
            }
        );

        // Also update selectedItem if it's the one being changed
        const selected = get().selectedItem;
        if (selected && selected.id === updatedItem.id && selected.type === updatedItem.type) {
            set({ selectedItem: { ...selected, ...updatedItem }});
        }
        // Also update active items if they are the one being changed
        const activeOrg = get().activeOrganization;
        if (activeOrg && activeOrg.id === updatedItem.id && activeOrg.type === updatedItem.type) {
            set({ activeOrganization: { ...activeOrg, ...updatedItem }});
        }
        const activeComp = get().activeCompany;
        if (activeComp && activeComp.id === updatedItem.id && activeComp.type === updatedItem.type) {
            set({ activeCompany: { ...activeComp, ...updatedItem }});
        }
    })),
    
    refreshActiveCompany: () => set(state => {
        const { activeCompany, activeOrganization } = state;
        if (!activeCompany || !activeOrganization) return {};

        const updatedCompany = activeOrganization.companies.find(c => c.id === activeCompany.id);

        if (updatedCompany) {
            return { activeCompany: updatedCompany };
        }
        return {};
    }),

    reset: () => set(initialState),
    };
});

export default useHierarchyStore; 