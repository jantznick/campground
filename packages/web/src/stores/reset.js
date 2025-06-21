import useHierarchyStore from './useHierarchyStore';
import useCompanyStore from './useCompanyStore';
import useOrganizationStore from './useOrganizationStore';
import useProjectStore from './useProjectStore';
import useTeamStore from './useTeamStore';
import useMembershipStore from './useMembershipStore';
import useUIStore from './useUIStore';
import useDomainStore from './useDomainStore';


export const resetAllStores = () => {
    useHierarchyStore.getState().reset();
    useCompanyStore.getState().reset();
    useOrganizationStore.getState().reset();
    useProjectStore.getState().reset();
    useTeamStore.getState().reset();
    useMembershipStore.getState().reset();
    useUIStore.getState().reset();
    useDomainStore.getState().reset();
}; 