import { create } from 'zustand';
import { produce } from 'immer';
import { enableMapSet } from 'immer';

enableMapSet();

// Helper to find an item and its full ancestry path
const findItemWithAncestry = (nodes, findFn) => {
    for (const org of nodes) {
        if (findFn(org)) return { organization: org };
        for (const company of org.companies || []) {
            if (findFn(company)) return { organization: org, company };
            for (const team of company.teams || []) {
                if (findFn(team)) return { organization: org, company, team };
                for (const project of team.projects || []) {
                    if (findFn(project)) return { organization: org, company, team, project };
                }
            }
        }
    }
    return null;
};

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

    const defaultNames = {
        organization: { singular: 'Organization', plural: 'Organizations' },
        company: { singular: 'Company', plural: 'Companies' },
        team: { singular: 'Team', plural: 'Teams' },
        project: { singular: 'Project', plural: 'Projects' },
    };

    return {
    ...initialState,

    getDisplayName: (type, form = 'singular') => {
        const { activeOrganization } = get();
        const customNames = activeOrganization?.hierarchyDisplayNames;
        
        if (customNames && customNames[type] && customNames[type][form]) {
            return customNames[type][form];
        }
        
        return defaultNames[type]?.[form] || type;
    },

    updateHierarchyDisplayNames: async (organizationId, displayNames) => {
        set({ isLoading: true });
        try {
            const response = await fetch(`/api/v1/organizations/${organizationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hierarchyDisplayNames: displayNames }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to update hierarchy names');
            }
            const updatedOrganization = await response.json();
            set(state => ({
                activeOrganization: { ...state.activeOrganization, ...updatedOrganization },
                isLoading: false,
            }));
            // Also update the organization within the main hierarchy list
            get().updateItem({ ...updatedOrganization, type: 'organization' });
            return updatedOrganization;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

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
                if (node.id === parentId) {
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

        // Also update the activeOrganization's company to include the new team
        if (item.type === 'team' && draft.activeOrganization?.companies) {
            const company = draft.activeOrganization.companies.find(c => c.id === parentId);
            if (company) {
                if (!company.teams) company.teams = [];
                company.teams.push(item);
            }
        }
        
        // Also update the activeOrganization's company's team to include the new project
        if (item.type === 'project' && draft.activeOrganization?.companies) {
            for (const company of draft.activeOrganization.companies) {
                const team = company.teams?.find(t => t.id === parentId);
                if (team) {
                    if (!team.projects) team.projects = [];
                    team.projects.push(item);
                    break; 
                }
            }
        }
    })),

    removeItem: (itemId, itemType) => set(produce(draft => {
        mutator(draft.hierarchy,
            node => node.id === itemId && node.type === itemType,
            (nodes, index) => nodes.splice(index, 1)
        );
    })),

    updateItem: (updatedItem) => set(produce(draft => {
        mutator(draft.hierarchy,
            node => node.id === updatedItem.id,
            (nodes, index) => {
                nodes[index] = { ...nodes[index], ...updatedItem };
            }
        );

        // Also update selectedItem if it's the one being changed
        if (draft.selectedItem && draft.selectedItem.id === updatedItem.id) {
            draft.selectedItem = { ...draft.selectedItem, ...updatedItem };
        }
        // Also update active items if they are the one being changed
        if (draft.activeOrganization && draft.activeOrganization.id === updatedItem.id) {
            const newActiveOrg = { ...draft.activeOrganization, ...updatedItem };
            draft.activeOrganization = newActiveOrg;
            
            if (updatedItem.accountType) {
                draft.accountType = updatedItem.accountType;
            }

            // If the plan is now standard, ensure the active company is set to the default.
            if (newActiveOrg.accountType === 'STANDARD' && newActiveOrg.defaultCompanyId) {
                draft.activeCompany = newActiveOrg.companies?.find(c => c.id === newActiveOrg.defaultCompanyId) || null;
            }
        }
        if (draft.activeCompany && draft.activeCompany.id === updatedItem.id) {
            draft.activeCompany = { ...draft.activeCompany, ...updatedItem };
        }
    })),
    
    setActiveItemsFromUrl: (pathname) => {
        const { hierarchy, setInitialActiveItems } = get();
        if (!pathname || !hierarchy || hierarchy.length === 0) return;

        const pathParts = pathname.split('/').filter(Boolean);
        if (pathParts.length < 2) return;

        const itemTypeSlug = pathParts[0];
        const itemId = pathParts[1];
        
        if (itemTypeSlug !== 'teams' && itemTypeSlug !== 'projects') return;

        const findFn = (node) => node.id === itemId;
        const ancestry = findItemWithAncestry(hierarchy, findFn);
        
        if (ancestry) {
            set({
                activeOrganization: ancestry.organization,
                activeCompany: ancestry.company,
                accountType: ancestry.organization.accountType || 'STANDARD',
            });
        } else {
            setInitialActiveItems();
        }
    },

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