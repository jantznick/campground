import React, { useState } from 'react';
import useHierarchyStore from '../../stores/useHierarchyStore';
import { Plus, Users, FolderKanban, Settings } from 'lucide-react';
import TeamItem from './TeamItem';
import CreateItemModal from '../CreateItemModal';
import { ITEM_TYPES } from '../../lib/constants';
import { useNavigate } from 'react-router-dom';

function HierarchySection({ isCollapsed }) {
    const { activeCompany, fetchHierarchy, hierarchy } = useHierarchyStore();
    const [modalState, setModalState] = useState({ isOpen: false, type: null, parentId: null });
    const [expandedTeamId, setExpandedTeamId] = useState(null);
    const navigate = useNavigate();

    const organization = hierarchy.length > 0 ? hierarchy[0] : null;

    const handleTeamToggle = (teamId, forceOpen = false) => {
        if (forceOpen) {
            setExpandedTeamId(teamId);
        } else {
            setExpandedTeamId(current => (current === teamId ? null : teamId));
        }
    };

    const handleCreateItem = (type, parentId) => {
        setModalState({ isOpen: true, type, parentId });
    };

    const handleModalClose = () => {
        setModalState({ isOpen: false, type: null, parentId: null });
    };

    const handleCreateSuccess = () => {
        fetchHierarchy();
        handleModalClose();
    };
    
    const handleOrgSettingsClick = () => {
        if (organization) {
            navigate(`/settings/organization/${organization.id}`);
        }
    };

    if (!organization) {
         return (
            <div className={`px-3 py-2 text-sm text-[var(--vanilla)]/60 ${isCollapsed ? 'hidden' : 'block'}`}>
                Loading organization...
            </div>
        );
    }

    return (
      <div className="mt-4">
        {/* Organization Header */}
        <div className="px-4 pt-2 pb-4 mb-2 border-b-2 border-white/10">
             <div className="flex items-start justify-between gap-2">
                <h2 className="flex-1 font-bold text-lg text-white break-words" title={organization.name}>
                    {organization.name}
                </h2>
                <button
                    onClick={handleOrgSettingsClick}
                    className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
                    title="Organization Settings"
                >
                    <Settings size={18} />
                </button>
            </div>
        </div>

        {/* Teams Section */}
        <div className={`flex items-center justify-between px-3 mb-2 transition-all duration-300 ${isCollapsed ? 'opacity-0 h-0' : 'opacity-100 h-auto'}`}>
            <span className="uppercase text-xs tracking-wider text-[var(--vanilla)]/60 font-semibold">Teams</span>
            {activeCompany && (
                <button
                    onClick={() => handleCreateItem(ITEM_TYPES.TEAM, activeCompany.id)}
                    className="p-1 rounded-lg hover:bg-white/10 text-[var(--vanilla)]/60 hover:text-[var(--xanthous)]"
                    title="Add new Team"
                >
                    <Plus size={14} />
                </button>
            )}
        </div>
        <ul className="space-y-1">
            {activeCompany && activeCompany.teams && activeCompany.teams.length > 0 ? (
                activeCompany.teams.map(team => (
                    <TeamItem
                        key={team.id}
                        team={team}
                        isExpanded={expandedTeamId === team.id}
                        onToggle={handleTeamToggle}
                        onCreateItem={handleCreateItem}
                        isCollapsed={isCollapsed}
                    />
                ))
            ) : (
                <li className={`px-3 py-1 text-xs text-[var(--vanilla)]/60 ${isCollapsed ? 'hidden' : 'block'}`}>
                    {activeCompany ? 'No teams yet.' : 'Select a company to see teams.'}
                </li>
            )}
        </ul>

        <CreateItemModal
            isOpen={modalState.isOpen}
            onClose={handleModalClose}
            type={modalState.type}
            parentId={modalState.parentId}
            onSuccess={handleCreateSuccess}
        />
      </div>
    );
}

export default HierarchySection; 