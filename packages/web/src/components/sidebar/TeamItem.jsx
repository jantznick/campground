import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Users, FolderKanban, Plus, Settings } from 'lucide-react';
import useHierarchyStore from '../../stores/useHierarchyStore';
import { ITEM_TYPES } from '../../lib/constants';
import ProjectItem from './ProjectItem';

function TeamItem({ team, isExpanded, onToggle, onCreateItem, isCollapsed }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { getDisplayName } = useHierarchyStore();

    const handleSelect = () => {
        navigate(`/teams/${team.id}`);
        onToggle(team.id, true);
    }

    const isDirectlyActive = location.pathname.startsWith(`/teams/${team.id}`);
    const isAncestorActive = !isDirectlyActive && team.projects?.some(p => location.pathname.startsWith(`/projects/${p.id}`));

    const teamButtonClasses = `group flex items-center w-full px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
        isDirectlyActive
          ? 'bg-[var(--orange-wheel)] text-[var(--prussian-blue)]'
          : isAncestorActive
          ? 'bg-white/5'
          : 'hover:bg-white/10 text-[var(--vanilla)]'
      } ${isCollapsed ? 'justify-center' : ''}`;


    return (
        <li className="space-y-1">
            <div className="flex items-center gap-2" title={isCollapsed ? team.name : ''}>
                <button
                    className={teamButtonClasses}
                    onClick={handleSelect}
                >
                    <Users size={18} className={`flex-shrink-0 ${isDirectlyActive ? 'text-[var(--prussian-blue)]' : 'text-[var(--xanthous)]'}`} />
                    {!isCollapsed && (
                        <>
                            <span className="truncate flex-1 text-left ml-2">{team.name}</span>
                            <Link to={`/settings/team/${team.id}`} className="hidden group-hover:block ml-auto" onClick={(e) => e.stopPropagation()}>
                                <Settings className="w-4 h-4 text-gray-400 hover:text-white" />
                            </Link>
                        </>
                    )}
                </button>
            </div>
            {!isCollapsed && (
                <div className={`
                    transition-all duration-300 ease-in-out overflow-hidden 
                    ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}
                `}>
                    <div className="bg-black/20 rounded-lg p-2 mt-1 ml-4">
                        <ul className="space-y-1">
                            <li className="flex items-center justify-between px-3 mt-1 mb-2">
                                <span className="uppercase text-xs tracking-wider text-[var(--vanilla)]/60 font-semibold">{getDisplayName('project', 'plural')}</span>
                                <button
                                    onClick={() => onCreateItem(ITEM_TYPES.PROJECT, team.id)}
                                    className="p-1 rounded-lg hover:bg-white/10 text-[var(--vanilla)]/60 hover:text-[var(--xanthous)]"
                                    title={`Add new ${getDisplayName('project', 'singular')}`}
                                >
                                    <Plus size={14} />
                                </button>
                            </li>
                            {team.projects && team.projects.length > 0 ? (
                                team.projects.map(project => <ProjectItem key={project.id} project={project} isCollapsed={isCollapsed} />)
                            ) : (
                                <li className="px-3 py-1 text-xs text-[var(--vanilla)]/60">No {getDisplayName('project', 'plural')} yet.</li>
                            )}
                        </ul>
                    </div>
                </div>
            )}
        </li>
    );
}

export default TeamItem; 