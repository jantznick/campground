import React, { useState, useEffect } from 'react';
import useHierarchyStore from '../../stores/useHierarchyStore';
import { Plus, Building2 } from 'lucide-react';
import CompanyItem from './CompanyItem';
import CreateItemModal from '../CreateItemModal';
import { ITEM_TYPES } from '../../lib/constants';
import useUIStore from '../../stores/useUIStore';

const OrganizationItem = ({ organization, onCreateItem, isCollapsed }) => {
  const { selectedItem, setSelectedItem } = useHierarchyStore();
  const { toggleSidebar } = useUIStore();
  const [expandedCompanyId, setExpandedCompanyId] = useState(null);

  const handleCompanyToggle = (companyId) => {
    setExpandedCompanyId(current => (current === companyId ? null : companyId));
  };

  const handleOrgClick = () => {
    setSelectedItem({ ...organization, type: 'organization' });
    if (isCollapsed) {
      toggleSidebar();
    }
  }
  
  return (
    <li className="space-y-1">
      {/* Organization Button */}
      <div className="flex items-center gap-2">
        <button
          className={`flex items-center flex-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
            selectedItem?.id === organization.id && selectedItem.type === 'organization'
              ? 'bg-[var(--orange-wheel)] text-[var(--prussian-blue)]'
              : 'hover:bg-white/10 text-[var(--vanilla)]'
          } ${isCollapsed ? 'justify-center' : ''}`}
          onClick={handleOrgClick}
          title={isCollapsed ? organization.name : ''}
        >
          <Building2 size={18} className="flex-shrink-0 text-[var(--xanthous)]" />
          <span className={`
            truncate text-left transition-all duration-200
            ${isCollapsed ? 'w-0 opacity-0' : 'flex-1 ml-2 opacity-100'}
          `}>
            {organization.name}
          </span>
        </button>
      </div>

      {/* Expanded Content: Companies List (only shown when sidebar is expanded) */}
      {!isCollapsed && (
        <ul className="space-y-1 pt-1">
          {/* Companies Header and "Add Company" Button */}
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
          
          {/* List of Companies */}
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
      )}
    </li>
  );
}

function HierarchySection({ isCollapsed }) {
    const { hierarchy, fetchHierarchy } = useHierarchyStore();
    const [modalState, setModalState] = useState({
      isOpen: false,
      type: null,
      parentId: null
    });
  
    useEffect(() => { 
      fetchHierarchy();
    }, [fetchHierarchy]);
  
    const handleCreateItem = (type, parentId) => {
      setModalState({
        isOpen: true,
        type,
        parentId
      });
    };
  
    const handleModalClose = () => {
      setModalState({
        isOpen: false,
        type: null,
        parentId: null
      });
    };
  
    const handleCreateSuccess = () => {
        fetchHierarchy();
        handleModalClose();
    };
    
    return (
      <div className="mt-6">
        <div className={`flex items-center justify-between px-3 mb-2 transition-all duration-300 ${isCollapsed ? 'opacity-0 h-0' : 'opacity-100 h-auto'}`}>
          <span className="uppercase text-xs tracking-wider text-[var(--vanilla)]/60 font-semibold">Organizations</span>
        </div>
        <ul className="space-y-1">
          {hierarchy.map((org) => (
            <OrganizationItem
              key={org.id}
              organization={org}
              onCreateItem={handleCreateItem}
              isCollapsed={isCollapsed}
            />
          ))}
          {!isCollapsed && hierarchy.length === 0 && (
            <li className="px-3 py-2 text-sm text-[var(--vanilla)]/60">
              No organizations yet. Click the + button to create one.
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