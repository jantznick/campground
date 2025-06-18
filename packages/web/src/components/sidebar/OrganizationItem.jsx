import React, { useState } from 'react';
import { Building, Plus, Settings } from 'lucide-react';
import useHierarchyStore from '../../stores/useHierarchyStore';
import CompanyItem from './CompanyItem';
import { ITEM_TYPES } from '../../lib/constants';
import { Link, useNavigate } from 'react-router-dom';

const OrganizationItem = ({ organization, isExpanded, onToggle, onCreateItem }) => {
  const { selectedItem, setSelectedItem } = useHierarchyStore();
  const [expandedCompanyId, setExpandedCompanyId] = useState(null);
  const navigate = useNavigate();

  const handleCompanyToggle = (companyId) => {
    setExpandedCompanyId(current => (current === companyId ? null : companyId));
  };

  const isSelected = selectedItem?.id === organization.id && selectedItem.type === 'organization';

  const organizationButtonClasses = `
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
      <div className="flex items-center gap-2">
        <button
          className={organizationButtonClasses}
          onClick={() => {
            setSelectedItem({ ...organization, type: 'organization' });
            onToggle(organization.id);
            navigate('/dashboard');
          }}
        >
          <Building size={18} className="mr-2 text-[var(--xanthous)]" />
          <span className="truncate flex-1 text-left">{organization.name}</span>
           <Link to={`/settings/organization/${organization.id}`} className="hidden group-hover:block ml-auto mr-2" onClick={(e) => e.stopPropagation()}>
                <Settings className="w-4 h-4 text-gray-400 hover:text-white" />
           </Link>
        </button>
      </div>

      <div className={`
        transition-all duration-300 ease-in-out overflow-hidden 
        ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}
      `}>
        <div className="bg-black/20 rounded-lg p-2 mt-1">
          <ul className="space-y-1">
            <li className="flex items-center justify-between px-3 mt-1 mb-2">
              <span className="uppercase text-xs tracking-wider text-[var(--vanilla)]/60 font-semibold">Companies</span>
              <button
                onClick={() => onCreateItem(ITEM_TYPES.COMPANY, organization.id)}
                className="p-1 rounded-lg hover:bg-white/10 text-[var(--vanilla)]/60 hover:text-[var(--xanthous)]"
                title="Add new Company"
              >
                <Plus size={14} />
              </button>
            </li>

            {organization.companies && organization.companies.length > 0 ? (
              organization.companies.map(company => (
                <CompanyItem
                  key={company.id}
                  company={company}
                  isExpanded={expandedCompanyId === company.id}
                  onToggle={handleCompanyToggle}
                  onCreateItem={onCreateItem}
                />
              ))
            ) : (
              <li className="px-3 py-1 text-xs text-[var(--vanilla)]/60">No companies yet.</li>
            )}
          </ul>
        </div>
      </div>
    </li>
  );
};

export default OrganizationItem; 