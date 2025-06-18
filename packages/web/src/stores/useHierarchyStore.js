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

const useHierarchyStore = create((set, get) => ({
    hierarchy: [],
    selectedItem: null,
    activeCompany: null,
    accountType: 'STANDARD',
    isLoading: false,
    error: null,

    fetchHierarchy: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/v1/hierarchy');
            if (!response.ok) throw new Error('Failed to fetch hierarchy data');
            
            const hierarchy = await response.json();
            const mainOrg = hierarchy.length > 0 ? hierarchy[0] : null;
            
            if (!mainOrg) {
                 set({ hierarchy: [], isLoading: false, activeCompany: null, accountType: 'STANDARD' });
                 return;
            }

            const accountType = mainOrg.accountType || 'STANDARD';
            const allCompanies = mainOrg.companies || [];
            let newActiveCompany = get().activeCompany;

            const activeCompanyStillExists = newActiveCompany && allCompanies.some(c => c.id === newActiveCompany.id);

            if (!activeCompanyStillExists) {
                if (accountType === 'STANDARD') {
                    newActiveCompany = allCompanies.find(c => c.id === mainOrg.defaultCompanyId) || allCompanies[0] || null;
                } else {
                    newActiveCompany = allCompanies[0] || null;
                }
            }
            
            set({ hierarchy, isLoading: false, activeCompany: newActiveCompany, accountType });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    setSelectedItem: (item) => set({ selectedItem: item }),
    setActiveCompany: (company) => set({ activeCompany: company }),

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
    })),
    
    refreshActiveCompany: () => set(state => {
        const { activeCompany, hierarchy } = state;
        if (!activeCompany || !hierarchy.length) return {};

        const org = hierarchy[0];
        const updatedCompany = org.companies.find(c => c.id === activeCompany.id);

        if (updatedCompany) {
            return { activeCompany: updatedCompany };
        }
        return {};
    }),
}));

export default useHierarchyStore; 