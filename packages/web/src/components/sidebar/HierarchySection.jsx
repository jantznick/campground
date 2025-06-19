import React, { useState, useRef, useEffect } from 'react';
import useHierarchyStore from '../../stores/useHierarchyStore';
import { Plus, Users, FolderKanban, Settings, ChevronsUpDown } from 'lucide-react';
import TeamItem from './TeamItem';
import CreateItemModal from '../CreateItemModal';
import { ITEM_TYPES } from '../../lib/constants';
import { useNavigate } from 'react-router-dom';
import OrganizationSwitcher from './OrganizationSwitcher';

function HierarchySection({ isCollapsed }) {
	const { activeCompany, fetchHierarchy, hierarchy, activeOrganization } = useHierarchyStore();
	const [modalState, setModalState] = useState({ isOpen: false, type: null, parentId: null });
	const [expandedTeamId, setExpandedTeamId] = useState(null);
	const [isOrgPopoverOpen, setOrgPopoverOpen] = useState(false);
	const popoverRef = useRef(null);
	const navigate = useNavigate();

	const showOrgSwitcher = hierarchy.length > 1;

	useEffect(() => {
		function handleClickOutside(event) {
			if (popoverRef.current && !popoverRef.current.contains(event.target)) {
				setOrgPopoverOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [popoverRef]);

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
		if (activeOrganization) {
			navigate(`/settings/organization/${activeOrganization.id}`);
		}
	};

	if (!activeOrganization) {
		return (
			<div className={`px-3 py-2 text-sm text-[var(--vanilla)]/60 ${isCollapsed ? 'hidden' : 'block'}`}>
				Loading organization...
			</div>
		);
	}

	return (
		<div className="mt-4">
			{/* Organization Header */}
			<div className="relative px-4 pt-2 pb-4 mb-2 border-b-2 border-white/10" ref={popoverRef}>
				<div className="flex items-center justify-between gap-2">
					{showOrgSwitcher && !isCollapsed ? (
					<button
						onClick={() => setOrgPopoverOpen(prev => !prev)}
						className="w-full flex items-center justify-between p-2 text-white/60 hover:bg-white/10 rounded-lg"
						title="Switch Organization"
					>
						<h2 className="font-bold text-lg text-white break-words" title={activeOrganization.name}>
							{activeOrganization.name}
						</h2>
							<ChevronsUpDown size={16} />
					</button>
					) : (
						<h2 className="font-bold text-lg text-white break-words" title={activeOrganization.name}>
							{activeOrganization.name}
						</h2>
					)}
					<button
						onClick={handleOrgSettingsClick}
						className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
						title="Organization Settings"
					>
						<Settings size={18} />
					</button>
				</div>
				{isOrgPopoverOpen && showOrgSwitcher && <OrganizationSwitcher onClose={() => setOrgPopoverOpen(false)} />}
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