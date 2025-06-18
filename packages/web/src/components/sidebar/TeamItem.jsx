import React, { useState } from 'react';
import { Users, Plus, Settings } from 'lucide-react';
import useHierarchyStore from '../../stores/useHierarchyStore';
import ProjectItem from './ProjectItem';
import { ITEM_TYPES } from '../../lib/constants';
import { Link, useNavigate } from 'react-router-dom';

const TeamItem = ({ team, isExpanded, onToggle, onCreateItem, isCollapsed }) => {
  const { selectedItem, setSelectedItem } = useHierarchyStore();
  const navigate = useNavigate();

  const handleToggle = () => {
    if (isCollapsed) return;
    onToggle(team.id);
  };
  
  const handleSelect = () => {
    setSelectedItem({ ...team, type: 'team' });
    if (isCollapsed) {
        onToggle(team.id, true);
        navigate('/dashboard'); 
    } else {
        onToggle(team.id);
    }
  }

  const teamButtonClasses = `group flex items-center w-full px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
    selectedItem?.id === team.id && selectedItem.type === 'team'
      ? 'bg-[var(--orange-wheel)] text-[var(--prussian-blue)]'
      : 'hover:bg-white/10 text-[var(--vanilla)]'
  } ${isCollapsed ? 'justify-center' : ''}`;

  return (
    <li className="space-y-1">
      <div className="flex items-center gap-2" title={isCollapsed ? team.name : ''}>
        <button
          className={teamButtonClasses}
          onClick={handleSelect}
        >
          <Users size={18} className="flex-shrink-0 text-[var(--xanthous)]" />
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

      {/* Expanded Content: Projects List */}
      {!isCollapsed && (
          <div className={`
            transition-all duration-300 ease-in-out overflow-hidden 
            ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}
          `}>
            <div className="bg-black/20 rounded-lg p-2 mt-1 ml-4">
              <ul className="space-y-1">
                {/* Projects Header and "Add Project" Button */}
                <li className="flex items-center justify-between px-3 mt-1 mb-2">
                  <span className="uppercase text-xs tracking-wider text-[var(--vanilla)]/60 font-semibold">Projects</span>
                  <button
                    onClick={() => onCreateItem(ITEM_TYPES.PROJECT, team.id)}
                    className="p-1 rounded-lg hover:bg-white/10 text-[var(--vanilla)]/60 hover:text-[var(--xanthous)]"
                    title="Add new Project"
                  >
                    <Plus size={14} />
                  </button>
                </li>
                
                {/* List of Projects */}
                {team.projects && team.projects.length > 0 ? (
                  team.projects.map(project => <ProjectItem key={project.id} project={project} isCollapsed={isCollapsed} />)
                ) : (
                  <li className="px-3 py-1 text-xs text-[var(--vanilla)]/60">No projects yet.</li>
                )}
              </ul>
            </div>
          </div>
      )}
    </li>
  );
};

export default TeamItem; 