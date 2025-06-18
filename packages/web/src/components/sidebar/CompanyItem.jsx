import React, { useState } from 'react';
import { Building2, Plus, Settings } from 'lucide-react';
import useHierarchyStore from '../../stores/useHierarchyStore';
import TeamItem from './TeamItem';
import { ITEM_TYPES } from '../../lib/constants';
import { Link, useNavigate } from 'react-router-dom';

const CompanyItem = ({ company, isExpanded, onToggle, onCreateItem }) => {
  const { selectedItem, setSelectedItem } = useHierarchyStore();
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const navigate = useNavigate();

  const handleTeamToggle = (teamId) => {
    setExpandedTeamId(current => (current === teamId ? null : teamId));
  };

  const isSelected = selectedItem?.id === company.id && selectedItem.type === 'company';

  const companyButtonClasses = `
    group flex items-center flex-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium
    ${isSelected
      ? 'bg-[var(--orange-wheel)] text-[var(--prussian-blue)]'
      : isExpanded
      ? 'bg-white/10 text-[var(--vanilla)]'
      : 'hover:bg-white/10 text-[var(--vanilla)]'
    }
  `;
  
  return (
    <li className="space-y-1">
      {/* Company Button */}
      <div className="flex items-center gap-2">
        <button
          className={companyButtonClasses}
          onClick={() => {
            setSelectedItem({ ...company, type: 'company' });
            onToggle(company.id);
            navigate('/dashboard');
          }}
        >
          <Building2 size={18} className="mr-2 text-[var(--xanthous)]" />
          <span className="truncate flex-1 text-left">{company.name}</span>
          <Link to={`/settings/company/${company.id}`} className="hidden group-hover:block ml-auto mr-2" onClick={(e) => e.stopPropagation()}>
              <Settings className="w-4 h-4 text-gray-400 hover:text-white" />
          </Link>
        </button>
      </div>

      {/* Expanded Content: Teams List */}
      <div className={`
        transition-all duration-300 ease-in-out overflow-hidden 
        ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}
      `}>
        <div className="bg-black/20 rounded-lg p-2 mt-1">
          <ul className="space-y-1">
            {/* Teams Header and "Add Team" Button */}
            <li className="flex items-center justify-between px-3 mt-1 mb-2">
              <span className="uppercase text-xs tracking-wider text-[var(--vanilla)]/60 font-semibold">Teams</span>
              <button
                onClick={() => onCreateItem(ITEM_TYPES.TEAM, company.id)}
                className="p-1 rounded-lg hover:bg-white/10 text-[var(--vanilla)]/60 hover:text-[var(--xanthous)]"
                title="Add new Team"
              >
                <Plus size={14} />
              </button>
            </li>

            {/* List of Teams */}
            {company.teams && company.teams.length > 0 ? (
              company.teams.map(team => (
                <TeamItem
                  key={team.id}
                  team={team}
                  isExpanded={expandedTeamId === team.id}
                  onToggle={handleTeamToggle}
                  onCreateItem={onCreateItem}
                />
              ))
            ) : (
              <li className="px-3 py-1 text-xs text-[var(--vanilla)]/60">No teams yet.</li>
            )}
          </ul>
        </div>
      </div>
    </li>
  );
};

export default CompanyItem; 