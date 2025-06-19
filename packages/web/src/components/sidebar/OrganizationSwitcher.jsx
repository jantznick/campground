import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useHierarchyStore from '../../stores/useHierarchyStore';
import { Check, Settings } from 'lucide-react';

const OrganizationSwitcher = ({ onClose }) => {
  const { hierarchy, activeOrganization, setActiveOrganization } = useHierarchyStore();
  const [hoveredOrgId, setHoveredOrgId] = useState(null);
  const navigate = useNavigate();

  const handleOrgSelect = (org) => {
    setActiveOrganization(org);
    onClose();
  };
  
  const handleEditClick = (e, orgId) => {
    e.stopPropagation();
    navigate(`/settings/organization/${orgId}`);
    onClose();
  };

  return (
    <div className="absolute top-full mt-2 left-4 right-4 bg-[var(--gunmetal)] rounded-lg shadow-2xl z-30 border border-white/10">
      <div className="p-2">
        <div className="flex justify-between items-center px-2 py-1">
          <span className="block text-xs font-semibold tracking-wider text-white/60 uppercase">Switch Organization</span>
        </div>
        <ul className="mt-1 max-h-48 overflow-y-auto">
          {hierarchy.map(org => (
            <li
              key={org.id}
              onMouseEnter={() => setHoveredOrgId(org.id)}
              onMouseLeave={() => setHoveredOrgId(null)}
              onClick={() => handleOrgSelect(org)}
              className="w-full text-left flex items-center justify-between p-2 rounded-md text-sm hover:bg-white/10 cursor-pointer"
            >
              <span className="truncate text-white">{org.name}</span>
               <div className="flex items-center gap-2">
                {(activeOrganization?.id === org.id || hoveredOrgId === org.id) && (
                    <button 
                        onClick={(e) => handleEditClick(e, org.id)}
                        className="p-1 rounded-md text-white/60 hover:text-white"
                        title="Organization Settings"
                    >
                        <Settings size={14} />
                    </button>
                )}
                {activeOrganization?.id === org.id && <Check size={16} className="text-[var(--orange-wheel)]" />}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default OrganizationSwitcher; 